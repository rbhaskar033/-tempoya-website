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
  ID: { country: "Indonesia", currency: "idr", amount: 1 },
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
      if (fresh.exists && ["pending", "creating"].includes(fresh.data().status) &&
          fresh.data().createdAt?.toMillis?.() > Date.now() - 30 * 60 * 1000) {
        throw new HttpsError("aborted", "A checkout is already being created or is pending. Reopen the existing checkout or wait for it to expire.");
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
            p.uid !== uid || p.purpose !== "account_verification_one_time" ||
            session.amount_total !== p.amount || String(session.currency || "").toLowerCase() !== p.currency) {
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


// Razorpay verification checkout. Secrets must be configured in Firebase before deployment.
// Razorpay/account approval and international-currency support are controlled by Razorpay.
const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");
const RAZORPAY_FEES = {
  IN:{country:"India",currency:"INR",amount:100}, US:{country:"United States",currency:"USD",amount:100},
  CA:{country:"Canada",currency:"CAD",amount:100}, GB:{country:"United Kingdom",currency:"GBP",amount:100},
  AU:{country:"Australia",currency:"AUD",amount:100}, NZ:{country:"New Zealand",currency:"NZD",amount:100},
  SG:{country:"Singapore",currency:"SGD",amount:100}, AE:{country:"United Arab Emirates",currency:"AED",amount:100},
  SA:{country:"Saudi Arabia",currency:"SAR",amount:100}, QA:{country:"Qatar",currency:"QAR",amount:100},
  DE:{country:"Germany",currency:"EUR",amount:100}, FR:{country:"France",currency:"EUR",amount:100},
  IT:{country:"Italy",currency:"EUR",amount:100}, ES:{country:"Spain",currency:"EUR",amount:100},
  NL:{country:"Netherlands",currency:"EUR",amount:100}, IE:{country:"Ireland",currency:"EUR",amount:100},
  JP:{country:"Japan",currency:"JPY",amount:1}, KR:{country:"South Korea",currency:"KRW",amount:1},
  MY:{country:"Malaysia",currency:"MYR",amount:100}, TH:{country:"Thailand",currency:"THB",amount:100},
  ID:{country:"Indonesia",currency:"IDR",amount:1}, PH:{country:"Philippines",currency:"PHP",amount:100}
};
function razorpayAuth() {
  return "Basic " + Buffer.from(RAZORPAY_KEY_ID.value() + ":" + RAZORPAY_KEY_SECRET.value()).toString("base64");
}
async function razorpayRequest(path, options = {}) {
  const response = await fetch("https://api.razorpay.com/v1" + path, {
    ...options, headers: { Authorization: razorpayAuth(), "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Razorpay API error", response.status, body.error?.code || "unknown");
    throw new HttpsError("failed-precondition", "Razorpay checkout is not enabled for this account/currency yet. No account was verified.");
  }
  return body;
}

exports.createRazorpayVerificationOrder = onCall(
  { region:"asia-south1", secrets:[RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], enforceAppCheck:true },
  async request => {
    const uid = requireAuth(request);
    const countryCode = String(request.data?.countryCode || "").toUpperCase();
    const fee = RAZORPAY_FEES[countryCode];
    if (!fee) throw new HttpsError("invalid-argument","Unsupported country.");
    const userRef = db.doc("users/" + uid), paymentRef = db.doc("verificationPayments/" + uid);
    const [userSnap,paymentSnap] = await Promise.all([userRef.get(),paymentRef.get()]);
    if (!userSnap.exists) throw new HttpsError("failed-precondition","Save your profile first.");
    const user=userSnap.data();
    if (!user.displayName || !Number.isInteger(user.age) || user.age<18 || user.country!==fee.country)
      throw new HttpsError("failed-precondition","Your saved adult profile country must match the selected country.");
    if (user.verificationFeePaid===true || user.verificationStatus==="verified" ||
        (paymentSnap.exists && paymentSnap.data().status==="paid"))
      throw new HttpsError("already-exists","This account has already paid the one-time verification fee.");
    const attemptId=crypto.randomUUID();
    await db.runTransaction(async tx=>{
      const snap=await tx.get(paymentRef);
      if(snap.exists && snap.data().status==="paid") throw new HttpsError("already-exists","Verification fee already paid.");
      if(snap.exists && ["creating","pending"].includes(snap.data().status) &&
        snap.data().provider==="razorpay" && snap.data().createdAt?.toMillis?.()>Date.now()-30*60*1000)
        throw new HttpsError("aborted","A verification checkout is already pending. Wait 30 minutes before creating another.");
      tx.set(paymentRef,{uid,countryCode,currency:fee.currency,amount:fee.amount,status:"creating",
        attemptId,provider:"razorpay",purpose:"account_verification_one_time",createdAt:Timestamp.now()});
    });
    try {
      const order=await razorpayRequest("/orders",{method:"POST",body:JSON.stringify({
        amount:fee.amount,currency:fee.currency,receipt:"tv_"+uid.slice(0,18)+"_"+attemptId.slice(0,8),
        notes:{uid,countryCode,attemptId,purpose:"account_verification_one_time"}
      })});
      await paymentRef.set({uid,countryCode,currency:fee.currency,amount:fee.amount,status:"pending",
        provider:"razorpay",razorpayOrderId:order.id,attemptId,purpose:"account_verification_one_time",
        createdAt:Timestamp.now()},{merge:true});
      return {keyId:RAZORPAY_KEY_ID.value(),orderId:order.id,amount:fee.amount,currency:fee.currency,
        businessName:"TEMPOYA",description:"One-time account verification",prefill:{name:user.displayName,email:user.email||undefined,contact:user.phoneNumber||undefined}};
    } catch(error) {
      await paymentRef.set({status:"checkout_creation_failed",updatedAt:Timestamp.now()},{merge:true});
      if(error instanceof HttpsError) throw error;
      console.error("Razorpay order creation failed",error.message);
      throw new HttpsError("internal","Could not create Razorpay order. No account was verified.");
    }
  }
);

exports.verifyRazorpayVerificationPayment = onCall(
  { region:"asia-south1", secrets:[RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET], enforceAppCheck:true },
  async request => {
    const uid=requireAuth(request);
    const orderId=String(request.data?.razorpay_order_id||"");
    const paymentId=String(request.data?.razorpay_payment_id||"");
    const signature=String(request.data?.razorpay_signature||"");
    if(!orderId||!paymentId||!signature) throw new HttpsError("invalid-argument","Missing Razorpay payment details.");
    const expected=crypto.createHmac("sha256",RAZORPAY_KEY_SECRET.value()).update(orderId+"|"+paymentId).digest("hex");
    const a=Buffer.from(expected),b=Buffer.from(signature);
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b)) throw new HttpsError("permission-denied","Payment signature is invalid.");
    const paymentRef=db.doc("verificationPayments/"+uid),userRef=db.doc("users/"+uid);
    const [pSnap,uSnap]=await Promise.all([paymentRef.get(),userRef.get()]);
    if(!pSnap.exists||!uSnap.exists) throw new HttpsError("failed-precondition","No matching verification order was found.");
    const p=pSnap.data(),u=uSnap.data();
    if(p.provider!=="razorpay"||p.razorpayOrderId!==orderId||p.uid!==uid||
       p.purpose!=="account_verification_one_time") throw new HttpsError("permission-denied","Order does not match this account.");
    if(p.status==="paid") return {verified:true,alreadyPaid:true};
    const payment=await razorpayRequest("/payments/"+encodeURIComponent(paymentId));
    if(payment.order_id!==orderId||payment.status!=="captured"||payment.amount!==p.amount||
       String(payment.currency).toUpperCase()!==String(p.currency).toUpperCase())
      throw new HttpsError("failed-precondition","Razorpay has not confirmed a captured payment matching this order.");
    await db.runTransaction(async tx=>{
      const [freshP,freshU]=await Promise.all([tx.get(paymentRef),tx.get(userRef)]);
      if(!freshP.exists||!freshU.exists) throw new HttpsError("not-found","Account or payment record not found.");
      const fp=freshP.data(),fu=freshU.data();
      if(fp.status==="paid") return;
      if(fp.razorpayOrderId!==orderId||fp.attemptId!==p.attemptId) throw new HttpsError("aborted","Payment attempt changed.");
      if(fu.verificationFeePaid===true||fu.verificationStatus==="verified") {
        tx.set(paymentRef,{status:"paid",razorpayPaymentId:paymentId,updatedAt:Timestamp.now()},{merge:true});
        return;
      }
      tx.set(paymentRef,{status:"paid",razorpayPaymentId:paymentId,paidAt:Timestamp.now(),updatedAt:Timestamp.now()},{merge:true});
      tx.set(userRef,{verificationFeePaid:true,verificationFeePaidAt:Timestamp.now(),
        verificationFeeCountry:fp.countryCode,verificationFeeCurrency:fp.currency,
        verificationStatus:"payment_received_pending_review",updatedAt:FieldValue.serverTimestamp()},{merge:true});
    });
    return {verified:true,alreadyPaid:false};
  }
);
