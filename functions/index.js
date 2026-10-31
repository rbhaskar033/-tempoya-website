const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();
function requireAuth(request) {
  if (!request.auth || !request.auth.uid) throw new HttpsError("unauthenticated", "Please sign in first.");
  return request.auth.uid;
}

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
  { region:"asia-south1", invoker:"public", secrets:[RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET], enforceAppCheck:true },
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
  { region:"asia-south1", invoker:"public", secrets:[RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET], enforceAppCheck:true },
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

// Booking checkout uses the server-side final tariff table; clients cannot choose an amount.
// Captured payments are recorded as paid. This is NOT escrow, split settlement or a hold/release service.
const BOOKING_COUNTRY_CODES = {
  "India":"IN","United States":"US","Canada":"CA","United Kingdom":"GB","Australia":"AU",
  "New Zealand":"NZ","Singapore":"SG","United Arab Emirates":"AE","Saudi Arabia":"SA","Qatar":"QA",
  "Germany":"DE","France":"FR","Italy":"IT","Spain":"ES","Netherlands":"NL","Ireland":"IE",
  "Japan":"JP","South Korea":"KR","Malaysia":"MY","Thailand":"TH","Indonesia":"ID","Philippines":"PH"
};
const BOOKING_CURRENCIES = {
  IN:"INR",US:"USD",CA:"CAD",GB:"GBP",AU:"AUD",NZ:"NZD",SG:"SGD",AE:"AED",SA:"SAR",QA:"QAR",
  DE:"EUR",FR:"EUR",IT:"EUR",ES:"EUR",NL:"EUR",IE:"EUR",JP:"JPY",KR:"KRW",MY:"MYR",TH:"THB",ID:"IDR",PH:"PHP"
};
const BOOKING_TARIFFS = {
  IN:{
    Basic:{"15":99,"30":199,"60":299,"120":499,"180":699},
    Standard:{"15":299,"30":499,"60":699,"120":999,"180":1299},
    Premium:{"15":599,"30":999,"60":1299,"120":1799,"180":2299}
  },
  INTERNATIONAL:{
    Basic:{"15":3,"30":5,"60":7,"120":9,"180":11},
    Standard:{"15":6,"30":8,"60":10,"120":12,"180":14},
    Premium:{"15":9,"30":10,"60":12,"120":14,"180":16}
  }
};
const ZERO_DECIMAL_CURRENCIES = new Set(["JPY","KRW","IDR"]);
function bookingMinorUnits(amount,currency) {
  return Math.round(amount * (ZERO_DECIMAL_CURRENCIES.has(currency) ? 1 : 100));
}

exports.createRazorpayBookingOrder = onCall(
  { region:"asia-south1", invoker:"public", secrets:[RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET], enforceAppCheck:true },
  async request => {
    const uid=requireAuth(request);
    const bookingId=String(request.data?.bookingId||"").trim();
    const tier=String(request.data?.tier||"");
    if(!bookingId || bookingId.length>150 || !["Basic","Standard","Premium"].includes(tier))
      throw new HttpsError("invalid-argument","Choose a valid booking and tariff tier.");
    const bookingRef=db.doc("bookings/"+bookingId);
    const bookingSnap=await bookingRef.get();
    if(!bookingSnap.exists) throw new HttpsError("not-found","Booking not found.");
    const booking=bookingSnap.data();
    if(booking.requesterId!==uid || !Array.isArray(booking.members) || !booking.members.includes(uid))
      throw new HttpsError("permission-denied","Only the booking requester can pay.");
    if(booking.status!=="accepted") throw new HttpsError("failed-precondition","Both people must accept the booking before payment.");
    if(![15,30,60,120,180].includes(booking.durationMinutes))
      throw new HttpsError("failed-precondition","Booking duration is invalid.");
    const userSnap=await db.doc("users/"+uid).get();
    if(!userSnap.exists) throw new HttpsError("failed-precondition","Save your profile first.");
    const countryCode=BOOKING_COUNTRY_CODES[String(userSnap.data().country||"")];
    const currency=BOOKING_CURRENCIES[countryCode];
    if(!countryCode||!currency) throw new HttpsError("failed-precondition","Your saved profile country is not supported.");
    const table=countryCode==="IN"?BOOKING_TARIFFS.IN:BOOKING_TARIFFS.INTERNATIONAL;
    const majorAmount=table[tier][String(booking.durationMinutes)];
    const amount=bookingMinorUnits(majorAmount,currency);
    const paymentRef=db.doc("bookingPayments/"+bookingId);
    const existing=await paymentRef.get();
    if(existing.exists && existing.data().status==="paid")
      throw new HttpsError("already-exists","This booking has already been paid.");
    if(existing.exists && ["creating","pending"].includes(existing.data().status) &&
       existing.data().createdAt?.toMillis?.()>Date.now()-30*60*1000)
      throw new HttpsError("aborted","A payment attempt is already pending. Check payment status before retrying.");
    const attemptId=crypto.randomUUID();
    await paymentRef.set({uid,bookingId,countryCode,currency,amount,tier,durationMinutes:booking.durationMinutes,
      status:"creating",provider:"razorpay",purpose:"booking",attemptId,createdAt:Timestamp.now()});
    try {
      const order=await razorpayRequest("/orders",{method:"POST",body:JSON.stringify({
        amount,currency,receipt:"tb_"+bookingId.slice(0,18)+"_"+attemptId.slice(0,8),
        notes:{uid,bookingId,countryCode,tier,durationMinutes:String(booking.durationMinutes),attemptId,purpose:"booking"}
      })});
      await paymentRef.set({status:"pending",razorpayOrderId:order.id,updatedAt:Timestamp.now()},{merge:true});
      return {keyId:RAZORPAY_KEY_ID.value(),orderId:order.id,amount,currency,
        businessName:"TEMPOYA",description:tier+" meeting booking ("+booking.durationMinutes+" min)"};
    } catch(error) {
      await paymentRef.set({status:"checkout_creation_failed",updatedAt:Timestamp.now()},{merge:true});
      if(error instanceof HttpsError) throw error;
      console.error("Razorpay booking order failed",error.message);
      throw new HttpsError("internal","Could not create the booking payment.");
    }
  }
);

exports.verifyRazorpayBookingPayment = onCall(
  { region:"asia-south1", invoker:"public", secrets:[RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET], enforceAppCheck:true },
  async request => {
    const uid=requireAuth(request);
    const orderId=String(request.data?.razorpay_order_id||"");
    const paymentId=String(request.data?.razorpay_payment_id||"");
    const signature=String(request.data?.razorpay_signature||"");
    const bookingId=String(request.data?.bookingId||"");
    if(!orderId||!paymentId||!signature||!bookingId)
      throw new HttpsError("invalid-argument","Missing booking payment details.");
    const expected=crypto.createHmac("sha256",RAZORPAY_KEY_SECRET.value()).update(orderId+"|"+paymentId).digest("hex");
    const a=Buffer.from(expected),b=Buffer.from(signature);
    if(a.length!==b.length||!crypto.timingSafeEqual(a,b))
      throw new HttpsError("permission-denied","Payment signature is invalid.");
    const paymentRef=db.doc("bookingPayments/"+bookingId),bookingRef=db.doc("bookings/"+bookingId);
    const [pSnap,bSnap]=await Promise.all([paymentRef.get(),bookingRef.get()]);
    if(!pSnap.exists||!bSnap.exists) throw new HttpsError("not-found","Booking payment record not found.");
    const p=pSnap.data(),booking=bSnap.data();
    if(p.uid!==uid||p.bookingId!==bookingId||p.razorpayOrderId!==orderId||p.purpose!=="booking"||
       booking.requesterId!==uid||booking.status!=="accepted")
      throw new HttpsError("permission-denied","Payment does not match this accepted booking.");
    if(p.status==="paid") return {paid:true,alreadyPaid:true};
    const payment=await razorpayRequest("/payments/"+encodeURIComponent(paymentId));
    if(payment.order_id!==orderId||payment.status!=="captured"||payment.amount!==p.amount||
       String(payment.currency).toUpperCase()!==String(p.currency).toUpperCase())
      throw new HttpsError("failed-precondition","Razorpay has not confirmed a captured payment matching this booking.");
    await db.runTransaction(async tx=>{
      const [freshP,freshB]=await Promise.all([tx.get(paymentRef),tx.get(bookingRef)]);
      if(!freshP.exists||!freshB.exists) throw new HttpsError("not-found","Booking payment record not found.");
      const fp=freshP.data(),fb=freshB.data();
      if(fp.status==="paid") return;
      if(fp.razorpayOrderId!==orderId||fp.attemptId!==p.attemptId||fb.requesterId!==uid||fb.status!=="accepted")
        throw new HttpsError("aborted","Booking or payment attempt changed. Contact support before retrying.");
      tx.set(paymentRef,{status:"paid",razorpayPaymentId:paymentId,paidAt:Timestamp.now(),updatedAt:Timestamp.now()},{merge:true});
      tx.set(bookingRef,{paymentStatus:"paid",paymentProvider:"razorpay",paymentCurrency:fp.currency,
        paymentAmount:fp.amount,paymentTier:fp.tier,paidAt:Timestamp.now(),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    });
    return {paid:true,alreadyPaid:false};
  }
);

