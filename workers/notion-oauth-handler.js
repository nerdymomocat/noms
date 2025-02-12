// notion-oauth-handler.js

function buildUrl(base, params) {
    const url = new URL(base);
    for (const key in params) {
        url.searchParams.append(key, params[key]);
    }
    return url.toString();
}

function generateState() {
    return crypto.randomUUID();
}

function handleCors(request) {
    const origin = request.headers.get("Origin");
    const allowedOrigins = [
        "https://nerdymomocat.github.io", // your GitHub Pages domain
        // "http://localhost:5173", etc. if you need local dev
    ];

    const headers = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
        "Access-Control-Allow-Credentials": "true",
    };

    if (allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
    }

    return headers;
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // Handle OPTIONS requests (CORS preflight)
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: handleCors(request) });
        }

        //
        // 1. /auth/login — Redirect user to Notion’s OAuth screen
        //
        if (pathname === "/auth/login") {
            const state = generateState();

            // Store state in KV for CSRF protection (short TTL)
            await env.NOTION_OAUTH_KV.put(`state:${state}`, "true", { expirationTtl: 600 });

            // Build Notion OAuth URL
            const notionAuthUrl = buildUrl("https://api.notion.com/v1/oauth/authorize", {
                client_id: env.CLIENT_ID,
                redirect_uri: `${url.origin}/auth/callback`,
                response_type: "code",
                owner: "user",
                state,
            });

            return Response.redirect(notionAuthUrl, 302);
        }

        //
        // 2. /auth/callback — Handle Notion’s redirect with ?code= & ?state=
        //
        if (pathname === "/auth/callback") {
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state");
            const error = url.searchParams.get("error");

            if (error) {
                return new Response(`Authorization Error: ${error}`, { status: 400 });
            }
            if (!code || !state) {
                return new Response("Invalid callback parameters", { status: 400 });
            }

            // Check CSRF state
            const validState = await env.NOTION_OAUTH_KV.get(`state:${state}`);
            if (!validState) {
                return new Response("Invalid state parameter (CSRF protection)", { status: 403 });
            }
            // Remove the used state from KV
            await env.NOTION_OAUTH_KV.delete(`state:${state}`);

            // Exchange the code for an access token
            const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
                method: "POST",
                headers: {
                    Authorization: "Basic " + btoa(`${env.CLIENT_ID}:${env.CLIENT_SECRET}`),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: `${url.origin}/auth/callback`,
                }),
            });

            if (!tokenResponse.ok) {
                const errorData = await tokenResponse.json();
                return new Response(
                    `Token Exchange Error: ${tokenResponse.status} - ${JSON.stringify(errorData)}`,
                    { status: tokenResponse.status }
                );
            }

            const tokenData = await tokenResponse.json();
            const botId = tokenData.bot_id;
            if (!botId) {
                return new Response("Missing bot_id in token response.", { status: 500 });
            }

            // Store the entire tokenData in KV for future use (optional)
            await env.NOTION_OAUTH_KV.put(`user:${botId}`, JSON.stringify(tokenData));

            // *** Key part: pass data in final redirect URL so front-end can skip KV read. ***
            // We'll pass everything you might need in query params. 
            // (Again, *beware* that means your token shows up in the URL bar!)
            const redirectParams = {
                botId,
                workspaceName: tokenData.workspace_name ?? "",
                workspaceIcon: tokenData.workspace_icon ?? "",
                // If you want to pass the access token directly, do it here:
                accessToken: tokenData.access_token,
                // ... but note that it's more secure NOT to include the token in the URL
            };

            const finalUrl = buildUrl(env.BASE_URL, redirectParams);

            // Set a cookie if you want, though cross-domain cookies might not flow to GitHub.
            return new Response(null, {
                status: 302,
                headers: {
                    Location: finalUrl,
                    "Set-Cookie": `notionBotId=${botId}; HttpOnly; Secure; Path=/; Max-Age=3600`,
                },
            });
        }

        //
        // 3. /auth/logout — Clears the KV entry for a given botId
        //
        if (pathname === "/auth/logout") {
            // Read botId from Authorization header: "Bearer <botId>"
            const botId = request.headers.get("Authorization")?.split(" ")[1];
            if (botId) {
                await env.NOTION_OAUTH_KV.delete(`user:${botId}`);
            }

            // Then redirect or just 200
            const corsHeaders = handleCors(request);
            return new Response(null, {
                status: 302,
                headers: {
                    Location: env.BASE_URL,
                    "Set-Cookie": `notionBotId=; HttpOnly; Secure; Path=/; Max-Age=0`,
                    ...corsHeaders,
                },
            });
        }

        //
        // 4. /auth/user — (Optional) Return user info from KV 
        //    If you still want an endpoint to re-check or refresh data
        //
        if (pathname === "/auth/user") {
            const botId = request.headers.get("Authorization")?.split(" ")[1];
            if (!botId) {
                return new Response(JSON.stringify({ loggedIn: false }), {
                    headers: { "Content-Type": "application/json", ...handleCors(request) },
                });
            }

            const userData = await env.NOTION_OAUTH_KV.get(`user:${botId}`, { type: "json" });
            if (!userData) {
                return new Response(JSON.stringify({ loggedIn: false }), {
                    headers: { "Content-Type": "application/json", ...handleCors(request) },
                });
            }

            // Return top-level fields
            const userInfo = {
                loggedIn: true,
                botId,
                accessToken: userData.access_token,
                workspaceName: userData.workspace_name,
                workspaceIcon: userData.workspace_icon,
            };

            return new Response(JSON.stringify(userInfo), {
                headers: { "Content-Type": "application/json", ...handleCors(request) },
            });
        }

        // 404 for anything else
        return new Response("Not Found", { status: 404, headers: handleCors(request) });
    },
};