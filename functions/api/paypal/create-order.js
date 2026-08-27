const PRODUCTS = {
    "prod-3": 5.00,
    "prod-9": 5.00,
    "prod-10": 5.00,
    "prod-1": 3.00,
    "prod-2": 4.85,
    "prod-4": 4.85,
    "prod-5": 4.85,
    "prod-6": 4.85,
    "prod-7": 4.85,
    "prod-8": 4.85
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json" }
    });
}

async function getUser(request, env) {
    const authorization = request.headers.get("authorization");
    if (!authorization || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            authorization
        }
    });
    return response.ok ? response.json() : null;
}

async function getPayPalToken(env) {
    const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
    const response = await fetch(`${env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com"}/v1/oauth2/token`, {
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

export async function onRequestPost({ request, env }) {
    try {
        const user = await getUser(request, env);
        if (!user?.id) return json({ error: "Please sign in before paying." }, 401);

        const body = await request.json();
        const items = Array.isArray(body.items) ? body.items : [];
        const ids = [...new Set(items.map(item => item?.id))];
        if (!ids.length || ids.length !== items.length || ids.some(id => !PRODUCTS[id])) {
            return json({ error: "The cart contains an invalid product." }, 400);
        }

        const total = ids.reduce((sum, id) => sum + PRODUCTS[id], 0);
        const accessToken = await getPayPalToken(env);
        const apiBase = env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
        const response = await fetch(`${apiBase}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${accessToken}`,
                "content-type": "application/json",
                prefer: "return=representation"
            },
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [{
                    custom_id: user.id,
                    amount: { currency_code: "USD", value: total.toFixed(2) },
                    description: "SimSim Fun Store digital products"
                }],
                application_context: {
                    brand_name: "SimSim Fun Store",
                    user_action: "PAY_NOW",
                    return_url: `${new URL(request.url).origin}/success.html`,
                    cancel_url: `${new URL(request.url).origin}/cart.html`
                }
            })
        });
        const order = await response.json();
        if (!response.ok || !order.id) return json({ error: "Could not create PayPal order." }, 502);

        const approvalLink = order.links?.find(link => link.rel === "approve")?.href;
        return json({ orderId: order.id, approvalLink });
    } catch (error) {
        console.error(error);
        return json({ error: "Unable to start PayPal checkout." }, 500);
    }
}
