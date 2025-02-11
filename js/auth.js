// auth.js
import { OAUTH_HANDLER_URL } from './constants.js';

//
// 1. Local Storage Helpers
//

/**
 * Save an item in localStorage with a TTL (time-to-live).
 * @param {string} key
 * @param {any} value
 * @param {number} ttl  Time in ms until this entry expires
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

//
// 2. UI: Show "Login / Logout / Disconnect" Buttons
//

/**
 * Update the header or any container with the correct UI
 * depending on whether the user is logged in or not.
 * @param {HTMLElement} userInfoContainer – typically a <div> where login/logout info goes
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
        // Hook up the event handlers
        document.getElementById('logout-button').addEventListener('click', logout);
        document.getElementById('disconnect-button').addEventListener('click', disconnect);

    } else {
        // User is not logged in
        const loginUrl = new URL("/auth/login", OAUTH_HANDLER_URL); // combine base + relative
        userInfoContainer.innerHTML = `
            <a href="${loginUrl.href}" class="px-4 py-2 text-white bg-black border-4 border-black rounded-md">
                Login with Notion
            </a>
        `;
    }
}

//
// 3. Initialization: Check if we just came back from Worker with ?botId=...
//

/**
 * Called on page load. Checks if there's a `botId` in the URL. If so, fetches user info
 * from the Worker, then stores it in localStorage. Finally, removes `botId` from the URL.
 * @returns {Promise<boolean>} whether the user is logged in
 */
async function initializeAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const botId = urlParams.get('botId');

    if (botId) {
        // We have a botId, so the user presumably completed the OAuth flow
        // Let’s fetch user info from the Worker
        const userUrl = new URL("/auth/user", OAUTH_HANDLER_URL);
        // We could pass the botId in the Authorization header or rely on Worker reading a cookie
        // But the example Worker checks the cookie by default. 
        // If you want to ensure it uses the header, do:
        //   const response = await fetch(userUrl, { headers: { Authorization: `Bearer ${botId}` }});

        const response = await fetch(userUrl);
        if (response.ok) {
            const userData = await response.json();
            if (userData && userData.loggedIn) {
                // Save in localStorage for 1 hour
                setLocalStorageWithExpiry("nomsData", {
                    accessToken: userData.accessToken,
                    botId: userData.botId,
                    workspaceName: userData.workspaceName,
                    workspaceIcon: userData.workspaceIcon,
                }, 3600 * 1000);
            }
        } else {
            console.error("Error fetching user data:", response.status, await response.text());
            alert("Error logging in. Please try again.");
        }

        // Remove botId from the URL
        urlParams.delete('botId');
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.replaceState({}, document.title, newUrl);
    }

    // Return whether we have a valid nomsData in localStorage
    return !!getLocalStorageWithExpiry("nomsData");
}

//
// 4. Actions: logout and disconnect
//

/**
 * "Logout" just removes localStorage so the user no longer appears logged in.
 * It does NOT delete anything from KV on the Worker side.
 */
async function logout() {
    localStorage.removeItem("nomsData");
    // Update UI if we’re on a page with #user-info
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        // Otherwise redirect to the home page
        window.location.href = "./index.html";
    }
}

/**
 * "Disconnect" means we remove the user’s entry from KV
 * and also clear localStorage. So the integration no longer
 * has a token on the Worker side.
 */
async function disconnect() {
    const nomsData = getLocalStorageWithExpiry("nomsData");
    if (!nomsData || !nomsData.botId) {
        alert("You are not logged in!");
        return;
    }

    const logoutUrl = new URL("/auth/logout", OAUTH_HANDLER_URL);
    // Pass the botId in Authorization header so the Worker can find & delete from KV
    const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${nomsData.botId}`,
        },
    });

    // Regardless of success, remove localStorage
    localStorage.removeItem("nomsData");

    // If your Worker returns 302, the user might be redirected. 
    // But to keep it simple, we can handle the final UI here.
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