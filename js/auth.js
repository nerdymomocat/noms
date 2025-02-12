// auth.js

import { OAUTH_HANDLER_URL } from './constants.js';

/**
 * Save a key/value to localStorage with an expiration time (in milliseconds).
 * After the expiry, the data is removed automatically.
 *
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - time-to-live in milliseconds
 */
function setLocalStorageWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Retrieve data from localStorage that may have an expiry.
 * Returns `null` if item is missing or expired.
 *
 * @param {string} key
 * @returns {any | null}
 */
function getLocalStorageWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

/**
 * Called once when the page loads. It looks for query parameters like
 * `?botId=...&workspaceName=...&accessToken=...` that your Worker might have
 * appended on the `/auth/callback` redirect. If present, it stores them in localStorage
 * and removes them from the URL.
 *
 * @returns {Promise<boolean>} - whether the user is considered "logged in" after this step
 */
export async function initializeAuth() {
    const urlParams = new URLSearchParams(window.location.search);

    // If your Worker appended these fields, parse them here.
    const botId = urlParams.get('botId');
    const workspaceName = urlParams.get('workspaceName') || '';
    const workspaceIcon = urlParams.get('workspaceIcon') || '';
    // If you also passed an accessToken in the query (be mindful of security),
    // parse it here; otherwise you can omit it if you prefer not to show tokens in URLs.
    const accessToken = urlParams.get('accessToken') || '';

    if (botId) {
        // The user just arrived from the Worker’s OAuth callback
        // Save the data in localStorage for 1 hour (3600 * 1000 ms)
        setLocalStorageWithExpiry('nomsData', {
            botId,
            workspaceName,
            workspaceIcon,
            accessToken, // optional
        }, 3600 * 1000);

        // Clean up the URL so these sensitive query params don’t stay in the address bar
        urlParams.delete('botId');
        urlParams.delete('workspaceName');
        urlParams.delete('workspaceIcon');
        urlParams.delete('accessToken');
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, document.title, newUrl);
    }

    // Return whether we have valid nomsData
    return !!getLocalStorageWithExpiry('nomsData');
}

/**
 * Updates a container (e.g., a <div id="user-info">) to display either:
 * - A "Login with Notion" link if not logged in.
 * - Or "Logged in as (workspaceName)" plus [Logout] and [Disconnect] buttons if logged in.
 *
 * @param {HTMLElement} userInfoContainer - The DOM element to fill with login/logout UI
 */
export async function updateUI(userInfoContainer) {
    const nomsData = getLocalStorageWithExpiry('nomsData');

    if (nomsData) {
        // Logged in UI
        userInfoContainer.innerHTML = `
      <span>Logged in as: ${nomsData.workspaceName}</span>
      <button id="logout-button"
        class="px-4 py-2 ml-4 text-white bg-black border-4 border-black rounded-md">
        Logout
      </button>
      <button id="disconnect-button"
        class="px-4 py-2 ml-4 text-white bg-red-500 border-4 border-black rounded-md">
        Disconnect from Notion
      </button>
    `;
        // Hook up buttons
        document.getElementById('logout-button').addEventListener('click', logout);
        document.getElementById('disconnect-button').addEventListener('click', disconnect);

    } else {
        // Not logged in UI
        // Build the URL for /auth/login in the Worker
        const loginUrl = new URL('/auth/login', OAUTH_HANDLER_URL);
        userInfoContainer.innerHTML = `
      <a href="${loginUrl.href}"
        class="px-4 py-2 text-white bg-black border-4 border-black rounded-md">
        Login with Notion
      </a>
    `;
    }
}

/**
 * "Logout" simply removes localStorage so the user appears logged out locally.
 * It does NOT remove any stored token in your Worker’s KV. 
 */
export async function logout() {
    localStorage.removeItem('nomsData');
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        window.location.href = './index.html';
    }
}

/**
 * "Disconnect" calls your Worker’s /auth/logout to remove the KV entry
 * and then clears localStorage. This fully disconnects the user’s integration.
 */
export async function disconnect() {
    const nomsData = getLocalStorageWithExpiry('nomsData');
    if (!nomsData || !nomsData.botId) {
        alert('You are not logged in!');
        return;
    }

    // Build the /auth/logout URL on your Worker
    const logoutUrl = new URL('/auth/logout', OAUTH_HANDLER_URL);

    // Pass the botId via Authorization header
    await fetch(logoutUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${nomsData.botId}`,
        },
    });

    // Regardless of Worker response, clear localStorage 
    localStorage.removeItem('nomsData');

    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        window.location.href = './index.html';
    }
}