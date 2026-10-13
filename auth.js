/*
 * TEMPOYA phone authentication foundation.
 * Real SMS remains disabled until firebase-config.js and Firebase Console setup are completed.
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
  const recaptchaContainer = document.getElementById("tempoya-recaptcha-container");
  const status = document.getElementById("tempoya-auth-status");
  let confirmationResult = null;
  let recaptchaVerifier = null;
  let auth = null;

  const configured = Boolean(firebaseConfig &&
    firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("PASTE_") &&
    firebaseConfig.authDomain && !String(firebaseConfig.authDomain).includes("PASTE_") &&
    firebaseConfig.projectId && !String(firebaseConfig.projectId).includes("PASTE_") &&
    firebaseConfig.appId && !String(firebaseConfig.appId).includes("PASTE_"));

  function say(message) { status.textContent = message; }
  function setBusy(busy) {
    sendButton.disabled = busy || !auth;
    verifyButton.disabled = busy || !auth || !confirmationResult;
  }
  function explainAuthError(error) {
    const messages = {
      "auth/too-many-requests": "Too many attempts. Please wait before trying again.",
      "auth/invalid-phone-number": "That phone number is invalid. Include the + country code.",
      "auth/captcha-check-failed": "Security check failed. Refresh the page and try again.",
      "auth/operation-not-allowed": "Phone sign-in is not enabled in Firebase.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
      "auth/billing-not-enabled": "Firebase requires a linked billing account for SMS phone authentication.",
      "auth/quota-exceeded": "Firebase SMS quota reached. Wait or review your Firebase billing/quota settings.",
      "auth/invalid-verification-code": "Incorrect OTP. Check the code and try again.",
      "auth/code-expired": "That OTP expired. Request a new code."
    };
    return messages[error?.code] || "Could not complete authentication. Check Firebase configuration, domain, SMS region policy and quota, then retry.";
  }

  if (!configured) {
    say("Setup required: add the Firebase Web App config in firebase-config.js, then authorize this domain and configure SMS regions in Firebase Console.");
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
        setBusy(false);
      });
    } catch (error) {
      say("Firebase initialization failed. Check the Web App configuration and reload.");
      sendButton.disabled = true;
      verifyButton.disabled = true;
      console.error("TEMPOYA Firebase initialization error", error);
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!auth) return say("Firebase setup is not complete.");
    const phone = phoneInput.value.trim().replace(/[\s()-]/g, "");
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      return say("Enter a valid international phone number including + country code.");
    }
    setBusy(true);
    confirmationResult = null;
    verifyButton.disabled = true;
    try {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      recaptchaContainer.replaceChildren();
      // Use the visible reCAPTCHA container for predictable manual testing on mobile browsers.
      recaptchaVerifier = new RecaptchaVerifier(auth, "tempoya-recaptcha-container", {});
      await recaptchaVerifier.render();
      confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      say("SMS code requested. Enter the 6-digit code received on your phone.");
      otpInput.focus();
    } catch (error) {
      console.error("TEMPOYA OTP send error", error);
      say(explainAuthError(error));
      confirmationResult = null;
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      recaptchaContainer.replaceChildren();
    } finally {
      setBusy(false);
    }
  });

  verifyButton.addEventListener("click", async () => {
    if (!confirmationResult) return say("First request an SMS code.");
    const code = otpInput.value.trim();
    if (!/^\d{6}$/.test(code)) return say("Enter the 6-digit OTP.");
    setBusy(true);
    try {
      const credential = await confirmationResult.confirm(code);
      confirmationResult = null;
      say("Phone verified and signed in. UID: " + credential.user.uid);
    } catch (error) {
      console.error("TEMPOYA OTP verification error", error);
      say(explainAuthError(error));
    } finally {
      setBusy(false);
    }
  });

  signOutButton.addEventListener("click", async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      confirmationResult = null;
      otpInput.value = "";
      setBusy(false);
      say("Signed out successfully.");
    } catch (error) {
      console.error("TEMPOYA sign-out error", error);
      say("Could not sign out. Please retry.");
    }
  });
}
