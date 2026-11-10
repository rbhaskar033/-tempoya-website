// Google Cloud Fraud Defense (reCAPTCHA Enterprise) browser integration.
// Public site key; it must match the key registered for app.tempoya.com.
import { recaptchaEnterpriseSiteKey } from "./app-check-config.js";
let enterpriseScriptPromise = null;
function loadEnterpriseScript() {
  if (window.grecaptcha?.enterprise) return Promise.resolve();
  if (enterpriseScriptPromise) return enterpriseScriptPromise;
  enterpriseScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/enterprise.js?render=" + encodeURIComponent(recaptchaEnterpriseSiteKey);
    script.async = true;
    script.defer = true;
    script.onload = () => window.grecaptcha?.enterprise ? resolve() : reject(new Error("Google Fraud Defense script did not initialize."));
    script.onerror = () => reject(new Error("Google Fraud Defense script could not load. Check the network and allowed website domain."));
    document.head.appendChild(script);
  }).catch(error => { enterpriseScriptPromise = null; throw error; });
  return enterpriseScriptPromise;
}
export async function getFraudDefenseToken(action) {
  if (!recaptchaEnterpriseSiteKey) throw new Error("Fraud Defense site key is missing.");
  if (!/^[A-Za-z0-9_]{2,64}$/.test(action)) throw new Error("Invalid Fraud Defense action.");
  await loadEnterpriseScript();
  await new Promise(resolve => window.grecaptcha.enterprise.ready(resolve));
  const token = await window.grecaptcha.enterprise.execute(recaptchaEnterpriseSiteKey, { action });
  if (typeof token !== "string" || token.length < 20) throw new Error("Google Fraud Defense did not return a valid security token.");
  return token;
}
