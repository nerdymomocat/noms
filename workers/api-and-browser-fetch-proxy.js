// Cloudfare worker named api-and-browser-fetch-proxy.js

export default {
    async fetch(request, env) {
        return await handleRequest(request, env);
    },
};

function getCorsHeaders(request) {
    return {
        "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Notion-Version",
    };
}

function handleOptions(request) {
    return new Response(null, {
        headers: getCorsHeaders(request),
    });
}

function withCors(request, response) {
    const corsHeaders = getCorsHeaders(request);
    const newResponse = new Response(response.body, response);
    for (const [key, value] of Object.entries(corsHeaders)) {
        newResponse.headers.set(key, value);
    }
    newResponse.headers.append("Vary", "Origin");
    return newResponse;
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
            return withCors(request, new Response("Unauthorized", { status: 403 }));
        }
        url.searchParams.delete("token");
    }

    const targetUrlParam = url.searchParams.get("url");
    if (!targetUrlParam) {
        return withCors(request, new Response("Missing url parameter", { status: 400 }));
    }

    let targetUrl;
    try {
        targetUrl = new URL(targetUrlParam).toString();
    } catch (err) {
        return withCors(request, new Response("Invalid target URL", { status: 400 }));
    }

    const modifiedRequest = new Request(targetUrl, request);
    modifiedRequest.headers.set("Origin", new URL(targetUrl).origin);

    const response = await fetch(modifiedRequest);
    return withCors(request, response);
}
