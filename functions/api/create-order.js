const TEST_AMOUNT_PAISE = 100; // ₹1.00 test payment only

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "allow": "POST, OPTIONS" } });
}

export async function onRequestPost({ request, env }) {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ error: "Payment service is not configured. Add Razorpay environment variables in Cloudflare Pages." }, 503);
  }
  // Keep this integration in test mode until a separate production review is completed.
  if (env.PAYMENTS_MODE !== "test" || !env.RAZORPAY_KEY_ID.startsWith("rzp_test_")) {
    return json({ error: "Checkout is not in test mode. Live collection is intentionally disabled in this build." }, 503);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  if (body?.planId !== "test_payment") {
    return json({ error: "Only the fixed ₹1 test payment is enabled. No user tariffs can be charged from this test endpoint." }, 400);
  }

  const payload = {
    amount: TEST_AMOUNT_PAISE,
    currency: "INR",
    receipt: "tempoya_test_" + crypto.randomUUID().replace(/-/g, "").slice(0, 20),
    notes: { product: "TEMPOYA", purpose: "integration_test", mode: "test" }
  };
  try {
    const auth = btoa(env.RAZORPAY_KEY_ID + ":" + env.RAZORPAY_KEY_SECRET);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "authorization": "Basic " + auth, "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 401 ? 401 : 502;
      return json({ error: status === 401 ? "Razorpay rejected the test credentials. Check the Test Key ID and Secret." : "Razorpay could not create the test order.", details: result?.error?.description || undefined }, status);
    }
    return json({ order_id: result.id, amount: result.amount, currency: result.currency, key_id: env.RAZORPAY_KEY_ID });
  } catch {
    return json({ error: "Could not reach Razorpay. Please try again." }, 502);
  }
}
