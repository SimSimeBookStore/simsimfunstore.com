import { fulfillOrder, getOrder, getPayPalToken, json } from "./_shared.js";

export async function onRequestPost({ request, env }) {
    try {
        if (!env.PAYPAL_WEBHOOK_ID) return json({ error: "PayPal webhook is not configured." }, 503);

        const body = await request.text();
        const verificationResponse = await verifyWebhookSignature(request, body, env);
        if (verificationResponse.verification_status !== "SUCCESS") {
            return json({ error: "Invalid PayPal webhook signature." }, 400);
        }

        const event = JSON.parse(body);
        if (event.event_type !== "PAYMENT.CAPTURE.COMPLETED") return json({ received: true });

        const capture = event.resource;
        const orderId = capture?.supplementary_data?.related_ids?.order_id;
        if (!orderId || capture.status !== "COMPLETED" || capture.amount?.currency_code !== "USD") {
            return json({ error: "Invalid PayPal capture event." }, 400);
        }

        const storedOrder = await getOrder(env, orderId);
        if (!storedOrder || storedOrder.status === "FULFILLED") return json({ received: true });

        const expectedTotal = storedOrder.total_cents / 100;
        if (Number(capture.amount.value) !== expectedTotal) {
            return json({ error: "PayPal capture amount does not match the order." }, 400);
        }

        const accessToken = await getPayPalToken(env);
        const apiBase = env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
        const orderResponse = await fetch(`${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
            headers: { authorization: `Bearer ${accessToken}` }
        });
        const order = await orderResponse.json();
        const purchaseUnit = order.purchase_units?.[0];
        if (!orderResponse.ok || order.status !== "COMPLETED" || purchaseUnit?.custom_id !== storedOrder.user_id) {
            return json({ error: "PayPal order could not be verified." }, 400);
        }

        await fulfillOrder(env, storedOrder, capture.id);
        return json({ received: true });
    } catch (error) {
        console.error(error);
        return json({ error: "Unable to process PayPal webhook." }, 500);
    }
}

async function verifyWebhookSignature(request, body, env) {
    const accessToken = await getPayPalToken(env);
    const apiBase = env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
    const response = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
        method: "POST",
        headers: {
            authorization: `Bearer ${accessToken}`,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            auth_algo: request.headers.get("paypal-auth-algo"),
            cert_url: request.headers.get("paypal-cert-url"),
            transmission_id: request.headers.get("paypal-transmission-id"),
            transmission_sig: request.headers.get("paypal-transmission-sig"),
            transmission_time: request.headers.get("paypal-transmission-time"),
            webhook_id: env.PAYPAL_WEBHOOK_ID,
            webhook_event: JSON.parse(body)
        })
    });
    if (!response.ok) throw new Error("PayPal webhook signature verification failed");
    return response.json();
}
