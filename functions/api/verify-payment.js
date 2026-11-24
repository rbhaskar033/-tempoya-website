function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { "allow": "POST, OPTIONS" } });
}

export async function onRequestPost({ request, env }) {
  if (!env.RAZORPAY_KEY_SECRET) return json({ error: "Payment verification is not configured." }, 503);
  if (env.PAYMENTS_MODE !== "test" || !env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")) {
    return json({ error: "Live payment verification is disabled in this test integration." }, 503);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON body." }, 400); }
  const orderId = body?.razorpay_order_id;
  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;
  if (![orderId, paymentId, signature].every(v => typeof v === "string" && v.length > 0)) {
    return json({ error: "Missing required payment verification fields." }, 400);
  }
  if (orderId.length > 128 || paymentId.length > 128 || !/^[a-f0-9]{64}$/i.test(signature)) {
    return json({ error: "Invalid payment verification fields." }, 400);
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.RAZORPAY_KEY_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const digest = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(orderId + "|" + paymentId)
    );
    const expected = toHex(digest);
    if (!constantTimeEqual(expected, signature.toLowerCase())) {
      return json({ verified: false, error: "Payment signature mismatch. Payment has NOT been marked as paid." }, 400);
    }
    // Signature verification alone does not confirm capture or persist a booking.
    return json({ verified: true, message: "Razorpay signature verified. This test endpoint does not mark a booking as paid." });
  } catch {
    return json({ error: "Unable to verify payment signature." }, 500);
  }
}
