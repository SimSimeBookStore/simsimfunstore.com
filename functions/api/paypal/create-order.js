import { PRODUCT_PRICES, getPayPalToken, getUser, json, saveOrder } from "./_shared.js";

export async function onRequestPost({ request, env }) {
    try {
        const user = await getUser(request, env);
        if (!user?.id) return json({ error: "Please sign in before paying." }, 401);

        const body = await request.json();
        const items = Array.isArray(body.items) ? body.items : [];
        const ids = [...new Set(items.map(item => item?.id))];
        if (!ids.length || ids.length !== items.length || ids.some(id => !PRODUCT_PRICES[id])) {
            return json({ error: "The cart contains an invalid product." }, 400);
        }

        const total = ids.reduce((sum, id) => sum + PRODUCT_PRICES[id], 0);
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
        if (!approvalLink) return json({ error: "PayPal did not provide an approval link." }, 502);
        await saveOrder(env, {
            orderId: order.id,
            userId: user.id,
            productIds: ids,
            totalCents: Math.round(total * 100)
        });
        return json({ orderId: order.id, approvalLink });
    } catch (error) {
        console.error(error);
        return json({ error: "Unable to start PayPal checkout." }, 500);
    }
}
