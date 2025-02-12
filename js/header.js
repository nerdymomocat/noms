// js/header.js

function createHeader() {
    const headerHTML = `
    <header>
        <div class="header-container">
                        <h1>
                <a href="./index.html">
                    <img src="./assets/noms-icon.svg" alt="Noms" class="logo-image">
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
        /* Header Styles (copied from your index.html) */
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
            font-family: 'Geist Mono', monospace; /* Geist Mono for headings */
            font-size: 3rem;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 1rem;
            text-align: center;
        }
         a {
            color: #000;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            padding: 0.5rem 1rem;
            border: 4px solid black;
            background-color: #FEA97F;  /* Accent color on buttons */
            box-shadow: 4px 4px 0 0 #000;
            transition: background-color 0.2s, color 0.2s;
            font-size: 1rem;
        }
        a:hover{
          background-color: black;
          color: white;
        }

        /* Responsive header adjustments */
        @media (max-width: 768px) {
            header {
                border-bottom-width: 4px;
            }

            .header-container {
                padding: 0 1rem;
            }
            h1{
                font-size: 2rem;
            }
            a{
                padding: 0.3rem 0.75rem;
                 border-width: 2px;
                 box-shadow: 2px 2px 0 0 #000;
                 font-size: 0.9rem;
               }
        }
        /* Style for buttons in user-info (consistent styling) */
        #user-info button {
            color: #000;
            text-decoration: none;
            font-weight: 700;
            display: inline-block;
            padding: 0.5rem 1rem;
            border: 4px solid black;
            background-color: #FEA97F;  /* Accent color on buttons */
            box-shadow: 4px 4px 0 0 #000;
            transition: background-color 0.2s, color 0.2s;
            font-size: 1rem;
            margin-left: 1rem; /* Add some spacing between buttons */
        }

        #user-info button:hover {
            background-color: black;
            color: white;
        }

          /* Responsive adjustments for header buttons */
        @media (max-width: 768px) {
            #user-info button {
                padding: 0.3rem 0.75rem;
                border-width: 2px;
                box-shadow: 2px 2px 0 0 #000;
                font-size: 0.9rem;
            }
        }

        .logo-image {
            height: 3rem;
            width: auto;
            vertical-align: middle;
        }

        @media (max-width: 768px) {
            .logo-image {
                height: 2rem;
            }
            /* ...existing media query styles... */
        }
    </style>
    `;
    //No need to create element.
    return headerHTML + styleHTML; //Just return string
}

export { createHeader };