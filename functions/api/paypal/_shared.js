const PRODUCT_PRICES = {
    "prod-3": 5.00,
    "prod-9": 5.00,
    "prod-10": 5.00,
    "prod-1": 3.00,
    "prod-2": 4.85,
    "prod-4": 4.85,
    "prod-5": 4.85,
    "prod-6": 4.85,
    "prod-7": 4.85,
    "prod-8": 4.85,
    "game-find-the-animal": 3.00,
    "game-collect-the-image": 3.00,
    "game-count-the-animals": 3.50
};

const ALLOWED_ORIGINS = new Set([
    "https://simsimfunstore.com",
    "https://www.simsimfunstore.com",
    "https://simsimebookstore.github.io",
    "https://simsimfunstore-com.pages.dev"
]);

function corsOrigin(request) {
    const origin = request?.headers?.get("origin");
    if (ALLOWED_ORIGINS.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "")) {
        return origin;
    }
    return "https://www.simsimfunstore.com";
}

function storeOrigin(request, env) {
    const origin = request?.headers?.get("origin");
    if (ALLOWED_ORIGINS.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "")) {
        return origin;
    }
    return env.STORE_ORIGIN || "https://www.simsimfunstore.com";
}

function json(data, status = 200, request) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "access-control-allow-origin": corsOrigin(request),
            "content-type": "application/json"
        }
    });
}

function options(request) {
    return new Response(null, {
        status: 204,
        headers: {
            "access-control-allow-headers": "authorization, content-type",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-origin": corsOrigin(request)
        }
    });
}

async function getUser(request, env) {
    const authorization = request.headers.get("authorization");
    if (!authorization || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization }
    });
    return response.ok ? response.json() : null;
}

async function getPayPalToken(env) {
    const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
    const response = await fetch(`${env.PAYPAL_API_BASE || "https://api-m.paypal.com"}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            authorization: `Basic ${credentials}`,
            "content-type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
    });
    if (!response.ok) throw new Error("PayPal authentication failed");
    return (await response.json()).access_token;
}

async function ensureOrderTable(env) {
    if (!env.DB) throw new Error("Payment order storage is not configured.");
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS paypal_orders (
            order_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            product_ids TEXT NOT NULL,
            total_cents INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'CREATED',
            capture_id TEXT,
            created_at INTEGER NOT NULL,
            fulfilled_at INTEGER
        )
    `).run();
}

async function saveOrder(env, order) {
    await ensureOrderTable(env);
    await env.DB.prepare(`
        INSERT INTO paypal_orders (order_id, user_id, product_ids, total_cents, created_at)
        VALUES (?, ?, ?, ?, ?)
    `).bind(order.orderId, order.userId, JSON.stringify(order.productIds), order.totalCents, Date.now()).run();
}

async function getOrder(env, orderId) {
    await ensureOrderTable(env);
    return env.DB.prepare("SELECT * FROM paypal_orders WHERE order_id = ?").bind(orderId).first();
}

async function fulfillOrder(env, order, captureId) {
    const productIds = JSON.parse(order.product_ids);
    const rows = productIds.map(productId => ({
        user_id: order.user_id,
        product_id: productId,
        product_data: { id: productId },
        paypal_transaction_id: captureId,
        payment_status: "completed"
    }));
    const supabaseHeaders = {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
        prefer: "resolution=merge-duplicates"
    };
    const libraryResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/library_items?on_conflict=user_id,product_id`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify(rows.map(row => ({
            user_id: row.user_id,
            product_id: row.product_id,
            product_data: row.product_data
        })))
    });
    if (!libraryResponse.ok) throw new Error("Could not save library items");

    const purchaseResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/purchases`, {
        method: "POST",
        headers: supabaseHeaders,
        body: JSON.stringify(rows)
    });
    if (!purchaseResponse.ok && purchaseResponse.status !== 409) throw new Error("Could not save purchase");

    await env.DB.prepare(`
        UPDATE paypal_orders SET status = 'FULFILLED', capture_id = ?, fulfilled_at = ?
        WHERE order_id = ?
    `).bind(captureId, Date.now(), order.order_id).run();
}

export {
    PRODUCT_PRICES,
    ensureOrderTable,
    fulfillOrder,
    getOrder,
    getPayPalToken,
    getUser,
    json,
    options,
    saveOrder,
    storeOrigin
};
