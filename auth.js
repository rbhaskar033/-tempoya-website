/*
 * TEMPOYA Firebase Phone OTP sign-in.
 * Public Firebase web config belongs in firebase-config.js; never add service-account keys here.
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
  let busy = false;
  let currentUser = null;

  const configured = Boolean(firebaseConfig &&
    firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes("PASTE_") &&
    firebaseConfig.authDomain && !String(firebaseConfig.authDomain).includes("PASTE_") &&
    firebaseConfig.projectId && !String(firebaseConfig.projectId).includes("PASTE_") &&
    firebaseConfig.appId && !String(firebaseConfig.appId).includes("PASTE_"));

  function say(message) {
    status.textContent = message;
  }

  // Only disable Verify while sending/verifying or when there is no active SMS request.
  // Do not disable it merely because the OTP field is still empty; show a clear validation message on tap.
  function updateButtons() {
    sendButton.disabled = busy || !auth;
    verifyButton.disabled = busy || !auth || !confirmationResult;
    signOutButton.hidden = !currentUser;
    signOutButton.disabled = busy || !auth || !currentUser;
  }

  function explainAuthError(error) {
    const messages = {
      "auth/too-many-requests": "Too many attempts. Please wait before trying again.",
      "auth/invalid-phone-number": "That phone number is invalid. Include the + country code.",
      "auth/captcha-check-failed": "Security check failed. Refresh the page and try again.",
      "auth/operation-not-allowed": "Phone sign-in is not enabled in Firebase.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
      "auth/billing-not-enabled": "Firebase requires a linked billing account for SMS phone authentication.",
      "auth/quota-exceeded": "Firebase SMS quota reached. Wait or review Firebase billing/quota settings.",
      "auth/invalid-verification-code": "Incorrect OTP. Check the code and try again.",
      "auth/code-expired": "That OTP expired. Request a new code."
    };
    return messages[error?.code] || "Could not complete authentication. Check Firebase configuration, domain, SMS region policy and quota, then retry.";
  }

  if (!configured) {
    say("Setup required: check firebase-config.js, Firebase authorized domains and SMS region settings.");
    sendButton.disabled = true;
    verifyButton.disabled = true;
    signOutButton.hidden = true;
  } else {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      auth.useDeviceLanguage();

      onAuthStateChanged(auth, user => {
        currentUser = user;
        updateButtons();
        // Do not overwrite the active OTP prompt when Firebase reports an existing session.
        if (confirmationResult) return;
        if (user) {
          say("Phone verified and signed in. Phone: " + (user.phoneNumber || "verified") + ". UID: " + user.uid);
        } else {
          say("Not signed in. Enter your phone number and request an SMS code.");
        }
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
    if (!auth) {
      say("Firebase setup is not complete.");
      return;
    }
    const dialCode = document.getElementById("tempoya-country-dial")?.value || "";
    let nationalNumber = phoneInput.value.trim().replace(/[^\d]/g, "");

    // If the user pastes a full international number, use it as-is.
    // Otherwise combine the selected country calling code with the national number.
    let phone = "";
    const pastedInternational = phoneInput.value.trim().replace(/[\s()-]/g, "");
    if (pastedInternational.startsWith("+")) {
      phone = pastedInternational;
    } else {
      // Strip a repeated selected calling code if the user included it in the national field.
      const dialDigits = dialCode.replace(/\D/g, "");
      if (dialDigits && nationalNumber.startsWith(dialDigits) && nationalNumber.length > 10) {
        nationalNumber = nationalNumber.slice(dialDigits.length);
      }
      phone = dialCode + nationalNumber;
    }

    // E.164: '+' followed by 8–15 digits overall; the first digit cannot be zero.
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      say("Enter a valid mobile number for the selected country, or paste the full international number including +.");
      phoneInput.focus();
      return;
    }
    phoneInput.value = phone;

    busy = true;
    confirmationResult = null;
    updateButtons();
    say("Preparing security check…");

    try {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      recaptchaContainer.replaceChildren();
      recaptchaVerifier = new RecaptchaVerifier(auth, "tempoya-recaptcha-container", {});
      await recaptchaVerifier.render();
      const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
      confirmationResult = result;
      otpInput.value = "";
      say("SMS code requested. Enter the 6-digit code received on your phone, then tap Verify OTP & Sign In.");
      updateButtons();
      otpInput.focus();
    } catch (error) {
      console.error("TEMPOYA OTP send error", error);
      confirmationResult = null;
      say(explainAuthError(error));
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
      recaptchaContainer.replaceChildren();
    } finally {
      busy = false;
      updateButtons();
    }
  });

  verifyButton.addEventListener("click", async () => {
    if (!confirmationResult) {
      say("First tap Send OTP and wait until the SMS code is requested.");
      return;
    }
    const code = otpInput.value.trim();
    if (!/^\d{6}$/.test(code)) {
      say("Enter all 6 digits from the SMS before signing in.");
      otpInput.focus();
      return;
    }

    busy = true;
    updateButtons();
    say("Verifying your SMS code…");
    try {
      const result = await confirmationResult.confirm(code);
      confirmationResult = null;
      currentUser = result.user;
      otpInput.value = "";
      say("Phone verified and signed in. Phone: " + (result.user.phoneNumber || "verified") + ". UID: " + result.user.uid);
    } catch (error) {
      console.error("TEMPOYA OTP verification error", error);
      say(explainAuthError(error));
    } finally {
      busy = false;
      updateButtons();
    }
  });

  signOutButton.addEventListener("click", async () => {
    if (!auth) return;
    busy = true;
    updateButtons();
    try {
      await signOut(auth);
      currentUser = null;
      confirmationResult = null;
      otpInput.value = "";
      say("Signed out successfully.");
    } catch (error) {
      console.error("TEMPOYA sign-out error", error);
      say("Could not sign out. Please retry.");
    } finally {
      busy = false;
      updateButtons();
    }
  });
}
