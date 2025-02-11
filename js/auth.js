// auth.js

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
  const notionData = getLocalStorageWithExpiry("notionData");

  if (notionData) {
    // User is logged in
    userInfoContainer.innerHTML = `
            <span>Logged in as: ${notionData.workspaceName}</span>
            <button id="logout-button" class="px-4 py-2 ml-4 text-white bg-black border-4 border-black rounded-md">Logout</button>
            <button id="disconnect-button" class="px-4 py-2 ml-4 text-white bg-red-500 border-4 border-black rounded-md">Disconnect from Notion</button>
        `;
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('disconnect-button').addEventListener('click', disconnect);
  } else {
    // User is not logged in
    userInfoContainer.innerHTML = `
            <a href="https://notion-oauth-handler.nerdymomocat.workers.dev/auth/login" class="px-4 py-2 text-white bg-black border-4 border-black rounded-md">Login with Notion</a>
        `;  // REPLACE WITH YOUR WORKER URL
  }
}

// Function to handle logout
async function logout() {
    localStorage.removeItem("notionData");
    // Find the userInfoContainer in the current page and update it
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        updateUI(userInfoContainer);
    } else {
        // If not on a page with userInfoContainer, redirect to index.html
        window.location.href = "/noms/index.html";
    }
}

// Function to handle disconnect
async function disconnect() {
    // Get botId from cookie
    const cookies = document.cookie;
    const botId = cookies?.match(/notionBotId=([^;]+)/)?.[1];

    // Send botId in Authorization Header to /auth/logout
    const response = await fetch("https://notion-oauth-handler.nerdymomocat.workers.dev/auth/logout", { // REPLACE WITH YOUR URL
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${botId}`,
        },
    });
    if (response.ok) {
        localStorage.removeItem("notionData"); // Clear local storage
        // Find the userInfoContainer in the current page and update it
        const userInfoContainer = document.getElementById('user-info');
        if (userInfoContainer) {
             updateUI(userInfoContainer);
        } else {
             // If not on a page with userInfoContainer, redirect to index.html
             window.location.href = "/noms/index.html";
        }

    }
}

// Export the functions so they can be used in other files
export { setLocalStorageWithExpiry, getLocalStorageWithExpiry, updateUI, logout, disconnect };
