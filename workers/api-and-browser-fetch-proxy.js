// Cloudfare worker named api-and-browser-fetch-proxy.js

const NOTION_API_END_POINT = "https://api.notion.com/v1";

export default {
    async fetch(request, env) {
        return await handleRequest(request, env);
    },
};

function getCorsHeaders(request) {
    return {
        "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization", // Important: Allow Authorization header
    };
}

function handleOptions(request) {
    return new Response(null, {
        headers: getCorsHeaders(request),
    });
}

async function handleRequest(request, env) {
    if (request.method === "OPTIONS") {
        return handleOptions(request);
    }

    const url = new URL(request.url);
    const requiredToken = (env.ALL_CORS_PROXY_MATCH_TOKEN || "").trim();

    if (requiredToken !== "") {
        const providedToken = url.searchParams.get("token");
        if (providedToken !== requiredToken) {
            return new Response("Unauthorized", { status: 403 });
        }
        url.searchParams.delete("token");
    }

    const isGeneral = url.searchParams.has("url");
    let targetUrl;

    if (isGeneral) {
        targetUrl = url.searchParams.get("url");
        url.searchParams.delete("url");
        try {
            targetUrl = new URL(targetUrl).toString();
        } catch (err) {
            return new Response("Invalid target URL", { status: 400 });
        }
    } else {
        // NOTION MODE: Construct the Notion API URL.
        let normalizedPath = url.pathname.replace(/\/{2,}/g, '/');
        const base = NOTION_API_END_POINT.replace(/\/$/, "");
        const path = normalizedPath.startsWith("/") ? normalizedPath : "/" + normalizedPath;
        targetUrl = base + path + url.search;
    }

    const modifiedRequest = new Request(targetUrl, request);
    modifiedRequest.headers.set("Origin", new URL(targetUrl).origin);

    // NOTION MODE: Add Notion-Version.  DO *NOT* forward Authorization!
    if (!isGeneral) {
        modifiedRequest.headers.set("Notion-Version", "2022-06-28");
        // REMOVE Authorization header forwarding:
        // if (request.headers.has("Authorization")) {
        //   modifiedRequest.headers.set("Authorization", request.headers.get("Authorization"));
        // }
    }

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Access-Control-Allow-Origin", request.headers.get("Origin") || "*");
    newResponse.headers.append("Vary", "Origin");
    return newResponse;
}