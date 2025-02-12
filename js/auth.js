// auth.js
import { OAUTH_HANDLER_URL } from './constants.js';

/**
 * Save an item in localStorage with a TTL (time-to-live).
 * @param {string} key
 * @param {any} value
 * @param {number} ttl - Time in ms until this entry expires
 */
function setLocalStorageWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Retrieve an item from localStorage, returning null if it’s expired or non-existent.
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
        // Item has expired
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

/**
 * Update the DOM to show either Login or Logout/Disconnect buttons.
 * @param {HTMLElement} userInfoContainer - Where to display buttons/info
 */
async function updateUI(userInfoContainer) {
    const nomsData = getLocalStorageWithExpiry("nomsData");
    if (nomsData) {
        // User is logged in
        userInfoContainer.innerHTML = `
            <span>Logged in as: ${nomsData.workspaceName}</span>
            <button id="logout-button" class="px-4 py-2 ml-4 text-white bg-black border-4 border-black rounded-md">
                Logout
            </button>
            <button id="disconnect-button" class="px-4 py-2 ml-4 text-white bg-red-500 border-4 border-black rounded-md">
                Disconnect from Notion
            </button>
        `;
        // Hook up buttons
        document.getElementById('logout-button').addEventListener('click', logout);
        document.getElementById('disconnect-button').addEventListener('click', disconnect);

    } else {
        // User is NOT logged in
        const loginUrl = new URL("/auth/login", OAUTH_HANDLER_URL);
        userInfoContainer.innerHTML = `
            <a href="${loginUrl.href}" class="px-4 py-2 text-white bg-black border-4 border-black rounded-md">
                Login with Notion
            </a>
        `;
    }
}

/**
 * Called on page load. 
 * - If the URL has `?botId=xyz`, fetch user info from the Worker (passing that botId in Authorization).
 * - If successful, store data in localStorage for 1 hour. 
 * - Remove `botId` from the URL afterward.
 * @returns {Promise<boolean>} - Whether the user is now logged in.
 */
async function initializeAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const botId = urlParams.get('botId');

    if (botId) {
        // We just arrived from the Worker’s OAuth callback
        const userUrl = new URL("/auth/user", OAUTH_HANDLER_URL);

        // Pass the botId in the Authorization header so the Worker can retrieve KV info
        const response = await fetch(userUrl, {
            headers: {
                'Authorization': `Bearer ${botId}`,
            },
        });

        if (response.ok) {
            const userData = await response.json();

            if (userData && userData.loggedIn) {
                // Store in localStorage for 1 hour
                setLocalStorageWithExpiry("nomsData", {
                    accessToken: userData.accessToken,
                    botId: userData.botId,
                    workspaceName: userData.workspaceName,
                    workspaceIcon: userData.workspaceIcon,
                }, 3600 * 1000);
            } else {
                console.warn("User not logged in, or no data returned from Worker.");
            }
        } else {
            console.error("Error fetching /auth/user:", response.status, await response.text());
            alert("Error logging in. Please try again.");
        }

        // Remove botId from the URL so it doesn't remain in the address bar
        urlParams.delete('botId');
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, document.title, newUrl);
    }

    return !!getLocalStorageWithExpiry("nomsData");
}

/**
 * "Logout" purely removes localStorage (so user appears logged out).
 * Does NOT remove anything in the Worker’s KV.
 */
async function logout() {
    localStorage.removeItem("nomsData");
    // Update UI if we’re on a page with #user-info
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        // If there's no container, redirect to home
        window.location.href = "./index.html";
    }
}

/**
 * "Disconnect" means remove the user’s token from the Worker’s KV
 * and remove localStorage on the front-end, so the user is fully disconnected.
 */
async function disconnect() {
    const nomsData = getLocalStorageWithExpiry("nomsData");
    if (!nomsData || !nomsData.botId) {
        alert("You are not logged in!");
        return;
    }

    const logoutUrl = new URL("/auth/logout", OAUTH_HANDLER_URL);
    // Pass the botId so the Worker can look up KV
    const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${nomsData.botId}`,
        },
    });

    // Regardless of success or failure, remove localStorage
    localStorage.removeItem("nomsData");

    // You could also handle the 302 redirect from the Worker, or just override it:
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        window.location.href = "./index.html";
    }
}

// Export for usage in other scripts
export {
    setLocalStorageWithExpiry,
    getLocalStorageWithExpiry,
    updateUI,
    logout,
    disconnect,
    initializeAuth
};