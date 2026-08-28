import { fulfillOrder, getOrder, getPayPalToken, getUser, json, options } from "./_shared.js";

export function onRequestOptions({ request }) {
    return options(request);
}

export async function onRequestPost({ request, env }) {
    try {
        const user = await getUser(request, env);
        if (!user?.id) return json({ error: "Your checkout session expired. Return to your cart and try PayPal checkout again." }, 401, request);

        const body = await request.json();
        const orderId = typeof body.orderId === "string" ? body.orderId : "";
        if (!orderId) {
            return json({ error: "Invalid order or cart." }, 400, request);
        }

        const storedOrder = await getOrder(env, orderId);
        if (!storedOrder || storedOrder.user_id !== user.id) {
            return json({ error: "This PayPal order is not valid for the signed-in account." }, 403, request);
        }
        if (storedOrder.status === "FULFILLED") {
            return json({ paid: true, transactionId: storedOrder.capture_id }, 200, request);
        }

        const expectedTotal = storedOrder.total_cents / 100;
        const accessToken = await getPayPalToken(env);
        const apiBase = env.PAYPAL_API_BASE || "https://api-m.paypal.com";
        const orderResponse = await fetch(`${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
            headers: { authorization: `Bearer ${accessToken}` }
        });
        const currentOrder = await orderResponse.json();
        if (!orderResponse.ok || currentOrder.id !== orderId || currentOrder.status !== "APPROVED" ||
            currentOrder.purchase_units?.[0]?.custom_id !== user.id) {
            return json({ error: "PayPal payment was not approved. No items were added." }, 402, request);
        }
        const response = await fetch(`${apiBase}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${accessToken}`,
                "content-type": "application/json",
                prefer: "return=representation"
            }
        });
        const order = await response.json();
        const capturedUnit = order.purchase_units?.[0];
        const captured = capturedUnit?.payments?.captures?.[0];
        const capturedTotal = Number(captured?.amount?.value);
        const paid = response.ok && order.status === "COMPLETED" && captured?.status === "COMPLETED" &&
            captured?.amount?.currency_code === "USD" && capturedTotal === expectedTotal &&
            capturedUnit?.custom_id === user.id && order.id === orderId;
        if (!paid) return json({ error: "PayPal payment could not be verified." }, 402, request);
        await fulfillOrder(env, storedOrder, captured.id);

        return json({ paid: true, transactionId: captured.id }, 200, request);
    } catch (error) {
        console.error(error);
        return json({ error: "Unable to verify payment." }, 500, request);
    }
}
