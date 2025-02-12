function createHeader() {
    const headerHTML = `
    <header>
        <div class="header-container">
            <h1>
                <a href="./index.html">
                    <img src="./assets/favicon.svg" alt="Noms" class="logo-image">
                </a>
            </h1>
            <div id="user-info">
                <!-- Login/Logout/Disconnect buttons and user info will go here -->
            </div>
        </div>
    </header>
    `;

    const styleHTML = `
    <style>
        /* Header Styles */
        header {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            padding: 1rem;
            background-color: #FEA97F;
            border-bottom: 8px solid #000;
        }
        .header-container {
            max-width: 800px;
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0 auto;
            padding: 0 2rem;
        }
        h1 {
            font-family: 'Geist Mono', monospace;
            font-size: 3rem;
            font-weight: 700;
            text-transform: uppercase;
            margin: 0;
            text-align: center;
            line-height: 0;
            display: flex;
            align-items: center;
        }
        /* Logo link styles */
        h1 a {
            color: #000;
            text-decoration: none;
            display: flex;
            align-items: center;
            padding: 0;
            background: none;
            border: none;
            box-shadow: none;
            line-height: 0;
        }
        h1 a:hover {
            background: none;
            color: #000;
        }
        .logo-image {
            height: 3rem;
            width: auto;
            display: block;
            vertical-align: middle;
            transition: filter 0.2s ease;
        }
        .logo-image:hover {
            filter: brightness(0.8) contrast(1.2);
        }
        /* User info buttons styling */
        #user-info button {
            color: #000;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            padding: 0.5rem 1rem;
            border: 4px solid black;
            background-color: #FEA97F;
            box-shadow: 4px 4px 0 0 #000;
            transition: background-color 0.2s, color 0.2s;
            font-size: 1rem;
            margin-left: 1rem;
        }
        #user-info button:hover {
            background-color: black;
            color: white;
        }
        /* Responsive adjustments */
        @media (max-width: 768px) {
            header {
                border-bottom-width: 4px;
            }
            .header-container {
                padding: 0 1rem;
            }
            h1 {
                font-size: 2rem;
            }
            #user-info button {
                padding: 0.3rem 0.75rem;
                border-width: 2px;
                box-shadow: 2px 2px 0 0 #000;
                font-size: 0.9rem;
            }
            .logo-image {
                height: 2rem;
            }
        }
    </style>
    `;
    return headerHTML + styleHTML + `
    <!-- Notice Banner -->
    <div class="notice-banner" style="max-width: 600px; margin: 1rem auto; padding: 1rem; background-color: rgba(254, 169, 127, 0.1); font-family: 'Geist Mono', monospace; text-align: center; font-size: 1rem;">
      Please note: <br>
      (a) I cannot guarantee this will remain free because Notion requires a CORS proxy, and to fetch URL information via the browser, proxified requests are needed as well.<br>
      (b) Do not close the tab while processing, as it happens in your browser, not on a server.
    </div>
    `;
}

export { createHeader };