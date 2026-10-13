/*
 * TEMPOYA phone authentication foundation.
 * Configure firebase-config.js in the Firebase Console before enabling real SMS.
 * Never put service-account credentials or private keys in client-side files.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const form = document.getElementById("tempoya-phone-form");
if (form) {
  const phoneInput = document.getElementById("tempoya-phone");
  const otpInput = document.getElementById("tempoya-otp");
  const sendButton = document.getElementById("tempoya-send-otp");
  const verifyButton = document.getElementById("tempoya-verify-otp");
  const signOutButton = document.getElementById("tempoya-signout");
  const status = document.getElementById("tempoya-auth-status");
  let confirmationResult = null;
  let recaptchaVerifier = null;
  let auth = null;

  const configured = firebaseConfig && firebaseConfig.apiKey &&
    !String(firebaseConfig.apiKey).includes("PASTE_") &&
    firebaseConfig.authDomain && !String(firebaseConfig.authDomain).includes("PASTE_") &&
    firebaseConfig.projectId && !String(firebaseConfig.projectId).includes("PASTE_") &&
    firebaseConfig.appId && !String(firebaseConfig.appId).includes("PASTE_");

  function say(message) { status.textContent = message; }
  function setBusy(busy) {
    sendButton.disabled = busy;
    verifyButton.disabled = busy;
  }

  if (!configured) {
    say("Setup required: add the Firebase Web App config in firebase-config.js, enable Phone sign-in, and authorize this domain in Firebase Console.");
    sendButton.disabled = true;
    verifyButton.disabled = true;
  } else {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      auth.useDeviceLanguage();
      onAuthStateChanged(auth, user => {
        if (user) {
          say("Signed in. Phone: " + (user.phoneNumber || "verified") + ". UID: " + user.uid);
          signOutButton.hidden = false;
        } else {
          say("Not signed in. Enter your phone number and request an SMS code.");
          signOutButton.hidden = true;
        }
      });
    } catch (error) {
      say("Firebase initialization failed. Check the Web App config and reload.");
      sendButton.disabled = true;
      verifyButton.disabled = true;
      console.error("TEMPOYA Firebase initialization error", error);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!auth) return say("Firebase setup is not complete.");
    const phone = phoneInput.value.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s()-]/g, ""))) {
      return say("Enter a valid international phone number including + country code.");
    }
    setBusy(true);
    try {
      if (recaptchaVerifier) recaptchaVerifier.clear();
      recaptchaVerifier = new RecaptchaVerifier(auth, "tempoya-send-otp", {
        size: "invisible",
        "expired-callback": () => say("Security check expired. Please try sending the code again.")
      });
      await recaptchaVerifier.render();
      confirmationResult = await signInWithPhoneNumber(auth, phone.replace(/[\s()-]/g, ""), recaptchaVerifier);
      say("SMS verification code requested. Enter the code received on your phone.");
      otpInput.focus();
    } catch (error) {
      console.error("TEMPOYA OTP send error", error);
      say(error.code === "auth/too-many-requests"
        ? "Too many attempts. Wait before trying again."
        : "Could not send OTP. Check Firebase Phone sign-in, SMS region policy, authorized domain, billing/quota, and phone format.");
      if (recaptchaVerifier) { recaptchaVerifier.clear(); recaptchaVerifier = null; }
    } finally { setBusy(false); }
  });

  verifyButton.addEventListener("click", async () => {
    if (!confirmationResult) return say("First request an SMS code.");
    const code = otpInput.value.trim();
    if (!/^\d{6}$/.test(code)) return say("Enter the 6-digit code received by SMS.");
    setBusy(true);
    try {
      const credential = await confirmationResult.confirm(code);
      say("Phone verified and signed in. UID: " + credential.user.uid);
    } catch (error) {
      console.error("TEMPOYA OTP verification error", error);
      say(error.code === "auth/invalid-verification-code"
        ? "Incorrect code. Check the SMS and try again."
        : "Could not verify the code. It may have expired; request a new one.");
    } finally { setBusy(false); }
  });

  signOutButton.addEventListener("click", async () => {
    try { await signOut(auth); confirmationResult = null; otpInput.value = ""; say("Signed out successfully."); }
    catch (error) { console.error("TEMPOYA sign-out error", error); say("Could not sign out. Please retry."); }
  });
}
