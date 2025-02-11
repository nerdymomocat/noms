// auth.js
import { OAUTH_HANDLER_URL } from './constants.js'; // Import the constant

// Helper function to set an item in localStorage with an expiration
function setLocalStorageWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
}

// Helper function to get an item from localStorage, checking for expiration
function getLocalStorageWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
        return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key); // Remove expired item
        return null;
    }
    return item.value;
}

// Function to update the UI based on login status
async function updateUI(userInfoContainer) {
    const nomsData = getLocalStorageWithExpiry("nomsData");

    if (nomsData) {
        // User is logged in
        userInfoContainer.innerHTML = `
            <span>Logged in as: ${nomsData.workspaceName}</span>
            <button id="logout-button" class="px-4 py-2 ml-4 text-white bg-black border-4 border-black rounded-md">Logout</button>
            <button id="disconnect-button" class="px-4 py-2 ml-4 text-white bg-red-500 border-4 border-black rounded-md">Disconnect from Notion</button>
        `;
        document.getElementById('logout-button').addEventListener('click', logout);
        document.getElementById('disconnect-button').addEventListener('click', disconnect);
    } else {
        // User is not logged in
        // Construct the URL safely:
        const loginUrl = new URL("/auth/login", OAUTH_HANDLER_URL); // Use URL object

        userInfoContainer.innerHTML = `
            <a href="${loginUrl.href}" class="px-4 py-2 text-white bg-black border-4 border-black rounded-md">Login with Notion</a>
        `;
    }
}

//Initialize authentication
async function initializeAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const botId = urlParams.get('botId');

    if (botId) {
        // We have a botId, so the user has likely just logged in.
        const userUrl = new URL("/auth/user", OAUTH_HANDLER_URL); // Use URL object!
        const response = await fetch(userUrl);

        if (response.ok) {
            const userData = await response.json();
            // Store *only* the necessary data in localStorage
            setLocalStorageWithExpiry("nomsData", {
                accessToken: userData.accessToken,
                botId: userData.botId,
                workspaceName: userData.workspaceName
            }, 3600 * 1000);
            // Remove botId from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Something went wrong fetching user data. Handle appropriately.
            console.error("Error fetching user data:", response.status, await response.text());
            alert("Error logging in. Please try again.");
            return; // Stop processing
        }
    }
    //Return if user is logged in or not
    return !!getLocalStorageWithExpiry("nomsData");
}

// Function to handle logout
async function logout() {
    localStorage.removeItem("nomsData");
    // Find the userInfoContainer in the current page and update it
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        // If not on a page with userInfoContainer, redirect to index.html
        window.location.href = "./index.html";
    }
}

// Function to handle disconnect
async function disconnect() {
    // Get botId from cookie
    const cookies = document.cookie;
    const botId = cookies?.match(/notionBotId=([^;]+)/)?.[1];

    // Send botId in Authorization Header to /auth/logout
    const response = await fetch(`${OAUTH_HANDLER_URL}/auth/logout`, { // Use the constant
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${botId}`,
        },
    });
    if (response.ok) {
        localStorage.removeItem("nomsData"); // Clear local storage
        // Find the userInfoContainer in the current page and update it
        const userInfoContainer = document.getElementById('user-info');
        if (userInfoContainer) {
            updateUI(userInfoContainer);
        } else {
            // If not on a page with userInfoContainer, redirect to index.html
            window.location.href = "./index.html";
        }

    }
}

// Export the functions so they can be used in other files
export { setLocalStorageWithExpiry, getLocalStorageWithExpiry, updateUI, logout, disconnect, initializeAuth };