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
  let invalidOtpAttempts = 0;
  const cooldownKey = "tempoya_otp_cooldown_until";
  let cooldownUntil = 0;
  let cooldownTimer = null;
  try { cooldownUntil = Number(localStorage.getItem(cooldownKey) || 0); } catch (_) {}

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
  function startCooldown(seconds, reason = "") {
    cooldownUntil = Date.now() + seconds * 1000;
    try { localStorage.setItem(cooldownKey, String(cooldownUntil)); } catch (_) {}
    if (cooldownTimer) clearInterval(cooldownTimer);
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      if (left > 0) {
        sendButton.textContent = "Wait " + left + "s to resend";
        sendButton.disabled = true;
        if (reason) say(reason + " You can request another SMS in " + left + " seconds.");
      } else {
        cooldownUntil = 0;
        try { localStorage.removeItem(cooldownKey); } catch (_) {}
        clearInterval(cooldownTimer);
        cooldownTimer = null;
        sendButton.textContent = "Send OTP";
        updateButtons();
        if (reason) say("Wait period ended. If Firebase still blocks requests, wait longer before retrying.");
      }
    };
    tick();
    cooldownTimer = setInterval(tick, 1000);
  }

  function updateButtons() {
    const coolingDown = Date.now() < cooldownUntil;
    sendButton.disabled = busy || !auth || coolingDown;
    if (coolingDown) sendButton.textContent = "Wait " + Math.ceil((cooldownUntil - Date.now()) / 1000) + "s to resend";
    else if (!busy) sendButton.textContent = "Send OTP";
    verifyButton.disabled = busy || !auth || !confirmationResult;
    signOutButton.hidden = !currentUser;
    signOutButton.disabled = busy || !auth || !currentUser;
  }

  function explainAuthError(error) {
    const messages = {
      "auth/too-many-requests": "Firebase temporarily limited SMS requests for security. Repeated attempts cannot be bypassed; wait before retrying.",
      "auth/invalid-phone-number": "That phone number is invalid. Include the + country code.",
      "auth/captcha-check-failed": "Security check failed. Refresh the page and try again.",
      "auth/operation-not-allowed": "Phone sign-in is not enabled in Firebase.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
      "auth/billing-not-enabled": "Firebase requires a linked billing account for SMS phone authentication.",
      "auth/quota-exceeded": "Firebase SMS quota reached. Wait or review Firebase billing/quota settings.",
      "auth/invalid-verification-code": "This code was not accepted. Use the code from the MOST RECENT TEMPOYA SMS only. If you requested another code, an earlier SMS code may no longer work. Do not request another SMS unless needed.",
      "auth/code-expired": "This OTP has expired. Wait until the resend timer ends, then request one new code and use that newest SMS.",
      "auth/session-expired": "This OTP session expired. Wait until the resend timer ends, request one new code, and use the newest SMS."
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
    if (Date.now() < cooldownUntil) {
      say("Please wait " + Math.ceil((cooldownUntil - Date.now()) / 1000) + " seconds before requesting another SMS.");
      updateButtons();
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
      invalidOtpAttempts = 0;
      startCooldown(60, "SMS requested.");
      otpInput.value = "";
      say("SMS code requested. Enter the 6-digit code received on your phone, then tap Verify OTP & Sign In.");
      updateButtons();
      otpInput.focus();
    } catch (error) {
      console.error("TEMPOYA OTP send error", error);
      confirmationResult = null;
      if (error?.code === "auth/too-many-requests") startCooldown(300, "Firebase rate limit reached.");
      else if (error?.code === "auth/quota-exceeded") startCooldown(300, "SMS quota may be exhausted.");
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
      say("Phone verified and signed in. Opening your TEMPOYA account…");
      // Send the authenticated user to the account landing page.
      window.location.assign("profile.html");
    } catch (error) {
      console.error("TEMPOYA OTP verification error", error);
      if (error?.code === "auth/invalid-verification-code") {
        invalidOtpAttempts += 1;
        if (invalidOtpAttempts >= 3) {
          confirmationResult = null;
          otpInput.value = "";
          say("Three codes were not accepted. To protect your account, this OTP session was reset. Wait until the resend timer ends, request ONE new SMS, and enter only the newest code.");
        } else {
          say(explainAuthError(error) + " Attempts remaining for this code: " + (3 - invalidOtpAttempts) + ".");
        }
      } else if (error?.code === "auth/code-expired" || error?.code === "auth/session-expired") {
        confirmationResult = null;
        otpInput.value = "";
        say(explainAuthError(error));
      } else {
        say(explainAuthError(error));
      }
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
