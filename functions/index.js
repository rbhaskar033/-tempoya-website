const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const Stripe = require("stripe");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// Amounts are in the currency's smallest unit. This is a nominal local-currency fee,
// not an FX conversion. Before enabling live payments, validate provider minimums,
// supported settlement currencies, tax, consumer law and merchant eligibility per country.
const FEES = {
  IN: { country: "India", currency: "inr", amount: 100 },
  US: { country: "United States", currency: "usd", amount: 100 },
  CA: { country: "Canada", currency: "cad", amount: 100 },
  GB: { country: "United Kingdom", currency: "gbp", amount: 100 },
  AU: { country: "Australia", currency: "aud", amount: 100 },
  NZ: { country: "New Zealand", currency: "nzd", amount: 100 },
  SG: { country: "Singapore", currency: "sgd", amount: 100 },
  AE: { country: "United Arab Emirates", currency: "aed", amount: 100 },
  SA: { country: "Saudi Arabia", currency: "sar", amount: 100 },
  QA: { country: "Qatar", currency: "qar", amount: 100 },
  DE: { country: "Germany", currency: "eur", amount: 100 },
  FR: { country: "France", currency: "eur", amount: 100 },
  IT: { country: "Italy", currency: "eur", amount: 100 },
  ES: { country: "Spain", currency: "eur", amount: 100 },
  NL: { country: "Netherlands", currency: "eur", amount: 100 },
  IE: { country: "Ireland", currency: "eur", amount: 100 },
  JP: { country: "Japan", currency: "jpy", amount: 1 },
  KR: { country: "South Korea", currency: "krw", amount: 1 },
  MY: { country: "Malaysia", currency: "myr", amount: 100 },
  TH: { country: "Thailand", currency: "thb", amount: 100 },
  ID: { country: "Indonesia", currency: "idr", amount: 100 },
  PH: { country: "Philippines", currency: "php", amount: 100 }
};

function stripeClient() {
  return new Stripe(STRIPE_SECRET_KEY.value());
}
function publicOrigin() {
  // Fixed allowlist: never accept arbitrary redirect URLs from a caller.
  return "https://tempoya.app";
}
function requireAuth(request) {
  if (!request.auth || !request.auth.uid) throw new HttpsError("unauthenticated", "Please sign in first.");
  return request.auth.uid;
}

exports.createVerificationCheckout = onCall(
  { region: "asia-south1", secrets: [STRIPE_SECRET_KEY], enforceAppCheck: true },
  async (request) => {
    const uid = requireAuth(request);
    const countryCode = String(request.data?.countryCode || "").toUpperCase();
    const fee = FEES[countryCode];
    if (!fee) throw new HttpsError("invalid-argument", "Unsupported country.");
    const userRef = db.doc("users/" + uid);
    const paymentRef = db.doc("verificationPayments/" + uid);
    const [userSnap, paymentSnap] = await Promise.all([userRef.get(), paymentRef.get()]);
    if (!userSnap.exists) throw new HttpsError("failed-precondition", "Complete and save your profile first.");
    const user = userSnap.data();
    if (!user.displayName || !Number.isInteger(user.age) || user.age < 18 || !user.country) {
      throw new HttpsError("failed-precondition", "Complete and save your adult profile first.");
    }
    if (user.country !== fee.country) throw new HttpsError("failed-precondition", "Selected country must match your saved profile country.");
    if (user.verificationStatus === "verified" || user.verificationFeePaid === true ||
        (paymentSnap.exists && paymentSnap.data().status === "paid")) {
      throw new HttpsError("already-exists", "This account's verification fee has already been paid.");
    }
    const now = Date.now();
    if (paymentSnap.exists && paymentSnap.data().status === "pending" &&
        paymentSnap.data().createdAt?.toMillis?.() > now - 30 * 60 * 1000 &&
        paymentSnap.data().checkoutUrl) {
      return { checkoutUrl: paymentSnap.data().checkoutUrl, reused: true };
    }

    const attemptId = crypto.randomUUID();
    const stripe = stripeClient();
    // Reserve the account-level payment slot before contacting the provider.
    await db.runTransaction(async tx => {
      const fresh = await tx.get(paymentRef);
      if (fresh.exists && fresh.data().status === "paid") {
        throw new HttpsError("already-exists", "Verification fee already paid.");
      }
      if (fresh.exists && fresh.data().status === "pending" &&
          fresh.data().createdAt?.toMillis?.() > Date.now() - 30 * 60 * 1000) {
        throw new HttpsError("aborted", "A checkout is already pending. Reopen the existing checkout or wait for it to expire.");
      }
      tx.set(paymentRef, {
        uid, countryCode, currency: fee.currency, amount: fee.amount,
        status: "creating", attemptId, createdAt: Timestamp.now(),
        purpose: "account_verification_one_time"
      });
    });

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: uid,
        customer_creation: "always",
        line_items: [{
          price_data: {
            currency: fee.currency,
            unit_amount: fee.amount,
            product_data: { name: "TEMPOYA one-time account verification", description: "Account verification only. One time per account." }
          },
          quantity: 1
        }],
        metadata: { uid, countryCode, purpose: "account_verification_one_time", attemptId },
        payment_intent_data: { metadata: { uid, countryCode, purpose: "account_verification_one_time", attemptId } },
        success_url: publicOrigin() + "/profile.html?verification=success",
        cancel_url: publicOrigin() + "/profile.html?verification=cancelled"
      }, { idempotencyKey: "tempoya-verification-" + attemptId });

      await paymentRef.set({
        uid, countryCode, currency: fee.currency, amount: fee.amount,
        status: "pending", attemptId, checkoutSessionId: session.id,
        checkoutUrl: session.url, createdAt: Timestamp.now(),
        purpose: "account_verification_one_time"
      }, { merge: true });
      return { checkoutUrl: session.url, reused: false };
    } catch (error) {
      await paymentRef.set({ status: "checkout_creation_failed", updatedAt: Timestamp.now() }, { merge: true });
      console.error("Checkout creation failed", error.message);
      throw new HttpsError("internal", "Could not create checkout. No verification status was changed.");
    }
  }
);

exports.stripeVerificationWebhook = onRequest(
  { region: "asia-south1", secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method not allowed");
    let event;
    try {
      event = stripeClient().webhooks.constructEvent(
        req.rawBody, req.headers["stripe-signature"], STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.warn("Invalid Stripe webhook signature");
      return res.status(400).send("Invalid signature");
    }
    if (event.type !== "checkout.session.completed" &&
        event.type !== "checkout.session.async_payment_succeeded") return res.status(200).send("Ignored");
    const session = event.data.object;
    if (session.payment_status !== "paid") return res.status(200).send("Not paid");
    const uid = session.metadata?.uid;
    const attemptId = session.metadata?.attemptId;
    if (!uid || !attemptId || session.metadata?.purpose !== "account_verification_one_time") {
      return res.status(400).send("Missing required metadata");
    }
    const paymentRef = db.doc("verificationPayments/" + uid);
    const userRef = db.doc("users/" + uid);
    try {
      await db.runTransaction(async tx => {
        const [pSnap, uSnap] = await Promise.all([tx.get(paymentRef), tx.get(userRef)]);
        if (!pSnap.exists || !uSnap.exists) throw new Error("Missing payment or user record");
        const p = pSnap.data();
        if (p.status === "paid") return; // Webhook retries are idempotent.
        if (p.attemptId !== attemptId || p.checkoutSessionId !== session.id ||
            p.uid !== uid || p.purpose !== "account_verification_one_time") {
          throw new Error("Payment attempt does not match the active account attempt");
        }
        const u = uSnap.data();
        if (u.verificationFeePaid === true || u.verificationStatus === "verified") {
          tx.set(paymentRef, { status: "paid", checkoutSessionId: session.id, updatedAt: Timestamp.now() }, { merge: true });
          return;
        }
        tx.set(paymentRef, {
          status: "paid", checkoutSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          paidAt: Timestamp.now(), updatedAt: Timestamp.now()
        }, { merge: true });
        tx.set(userRef, {
          verificationFeePaid: true,
          verificationFeePaidAt: Timestamp.now(),
          verificationFeeCountry: p.countryCode,
          verificationFeeCurrency: p.currency,
          verificationStatus: "payment_received_pending_review",
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
      });
      return res.status(200).send("Processed");
    } catch (err) {
      console.error("Webhook processing failed", err.message);
      return res.status(500).send("Processing failed");
    }
  }
);
