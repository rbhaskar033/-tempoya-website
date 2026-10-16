const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

if (!getApps().length) initializeApp();
const db = getFirestore();
const REGION = "asia-south1";
const ACTIVE_BOOKING_STATES = ["accepted", "payment_pending", "confirmed", "in_progress", "completion_pending"];

function uidOf(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Please sign in.");
  return request.auth.uid;
}
function validText(value, max = 300) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

/**
 * Saves the signed-in user's emergency contact. This is private data and must never
 * be copied into publicProfiles. The client must obtain consent from the contact.
 */
exports.saveEmergencyContact = onCall({ region: REGION, enforceAppCheck: true }, async request => {
  const uid = uidOf(request);
  const name = String(request.data?.name || "").trim();
  const phone = String(request.data?.phone || "").trim();
  const relationship = String(request.data?.relationship || "").trim();
  if (!validText(name, 80) || !/^\+[1-9]\d{7,14}$/.test(phone) || !validText(relationship, 50)) {
    throw new HttpsError("invalid-argument", "Enter a contact name, relationship, and phone in international format (+countrycode...).");
  }
  await db.doc("privateEmergencyContacts/" + uid).set({
    uid, name, phone, relationship, updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return { saved: true };
});

/**
 * Requests an SOS and sends push notifications only to the signed-in user's saved
 * emergency contact devices registered under emergencyContactDevices/{uid}/tokens.
 * Push delivery is best-effort; the caller must show the returned status and provide
 * a fallback to call local emergency services. This is not a substitute for emergency services.
 */
exports.requestSOS = onCall({ region: REGION, enforceAppCheck: true }, async request => {
  const uid = uidOf(request);
  const note = String(request.data?.note || "SOS requested").trim().slice(0, 240);
  const bookingId = String(request.data?.bookingId || "").trim().slice(0, 120);
  const contactSnap = await db.doc("privateEmergencyContacts/" + uid).get();
  if (!contactSnap.exists) throw new HttpsError("failed-precondition", "Save an emergency contact before using SOS.");
  const contact = contactSnap.data();
  const eventRef = db.collection("sosEvents").doc();
  const payload = {
    uid, bookingId: bookingId || null, note,
    contactName: contact.name, contactPhone: contact.phone,
    status: "queued", createdAt: FieldValue.serverTimestamp(),
    deliveryStatus: "pending"
  };
  await eventRef.set(payload);
  const tokensSnap = await db.collection("emergencyContactDevices").doc(uid).collection("tokens").get();
  const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean).slice(0, 20);
  if (!tokens.length) {
    await eventRef.set({ status: "contact_has_no_registered_device", deliveryStatus: "not_sent", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { eventId: eventRef.id, deliveryStatus: "not_sent", fallbackPhone: contact.phone, message: "No emergency-contact device is registered. Call the contact or local emergency services now." };
  }
  try {
    const result = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title: "TEMPOYA SOS", body: note },
      data: { type: "TEMPOYA_SOS", eventId: eventRef.id, uid, bookingId },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default", contentAvailable: true } } }
    });
    const delivered = result.successCount > 0;
    await eventRef.set({
      status: delivered ? "notification_sent" : "delivery_failed",
      deliveryStatus: delivered ? "provider_accepted" : "failed",
      successCount: result.successCount, failureCount: result.failureCount,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    return {
      eventId: eventRef.id,
      deliveryStatus: delivered ? "provider_accepted" : "failed",
      fallbackPhone: contact.phone,
      message: delivered ? "Push provider accepted the notification; receipt by the contact is not guaranteed." : "Notification failed. Call the contact or local emergency services now."
    };
  } catch (error) {
    await eventRef.set({ status: "delivery_failed", deliveryStatus: "failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { eventId: eventRef.id, deliveryStatus: "failed", fallbackPhone: contact.phone, message: "Notification could not be sent. Call the contact or local emergency services now." };
  }
});

/**
 * Records each participant's completion confirmation. It deliberately does not
 * release/transfer funds. Payment release requires a provider-supported connected
 * account/marketplace settlement model and compliance approval; this endpoint only
 * transitions the booking into payment_review_pending once both users confirm.
 */
exports.confirmBookingCompletion = onCall({ region: REGION, enforceAppCheck: true }, async request => {
  const uid = uidOf(request);
  const bookingId = String(request.data?.bookingId || "").trim();
  if (!/^[A-Za-z0-9_-]{10,150}$/.test(bookingId)) throw new HttpsError("invalid-argument", "Invalid booking ID.");
  const ref = db.doc("bookings/" + bookingId);
  const result = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Booking not found.");
    const booking = snap.data();
    if (!Array.isArray(booking.members) || booking.members.length !== 2 || !booking.members.includes(uid)) {
      throw new HttpsError("permission-denied", "Only booking participants can confirm completion.");
    }
    if (!ACTIVE_BOOKING_STATES.includes(booking.status) && booking.status !== "payment_review_pending") {
      throw new HttpsError("failed-precondition", "Booking is not in a completable state.");
    }
    const confirmations = booking.completionConfirmations || {};
    if (confirmations[uid]) return { alreadyConfirmed: true, bothConfirmed: Boolean(booking.members.every(id => confirmations[id])) };
    confirmations[uid] = { confirmedAt: Timestamp.now() };
    const bothConfirmed = booking.members.every(id => Boolean(confirmations[id]));
    tx.update(ref, {
      completionConfirmations: confirmations,
      status: bothConfirmed ? "payment_review_pending" : "completion_pending",
      paymentStatus: booking.paymentStatus || "not_enabled",
      updatedAt: FieldValue.serverTimestamp()
    });
    return { alreadyConfirmed: false, bothConfirmed };
  });
  return {
    ...result,
    status: result.bothConfirmed ? "payment_review_pending" : "completion_pending",
    paymentStatus: "not_released",
    message: result.bothConfirmed
      ? "Both participants confirmed. Payment is NOT automatically released; provider settlement configuration and review are still required."
      : "Your confirmation is saved. Waiting for the other participant."
  };
});
