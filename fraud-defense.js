// Google Cloud Fraud Defense (reCAPTCHA Enterprise) runs in an isolated same-origin
// frame so it cannot accidentally reuse Firebase App Check's different reCAPTCHA key.
const pendingRequests = new Map();
let frameElement = null;
let frameReadyPromise = null;
let nextRequestId = 0;

function getFraudDefenseFrame() {
  if (frameReadyPromise) return frameReadyPromise;
  frameReadyPromise = new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.title = "TEMPOYA security verification";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:absolute;width:1px;height:1px;border:0;left:-10000px;top:-10000px";
    frameElement = frame;

    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      const data = event.data || {};
      if (data.type === "tempoya-fraud-frame-ready") {
        window.removeEventListener("message", onMessage);
        resolve(frame);
      } else if (data.type === "tempoya-fraud-frame-error") {
        window.removeEventListener("message", onMessage);
        frameReadyPromise = null;
        frameElement = null;
        frame.remove();
        reject(new Error(data.message || "Google Fraud Defense failed to initialize."));
      } else if (data.type === "tempoya-fraud-token-result" && typeof data.requestId === "string") {
        const pending = pendingRequests.get(data.requestId);
        if (!pending) return;
        pendingRequests.delete(data.requestId);
        clearTimeout(pending.timeout);
        if (data.error) pending.reject(new Error(data.error));
        else pending.resolve(data.token);
      }
    };
    window.addEventListener("message", onMessage);
    frame.onerror = () => {
      window.removeEventListener("message", onMessage);
      frameReadyPromise = null;
      frameElement = null;
      reject(new Error("TEMPOYA Fraud Defense frame could not be loaded."));
    };
    frame.src = "/fraud-defense-frame.html";
    document.body.appendChild(frame);
    setTimeout(() => {
      if (frameReadyPromise) {
        window.removeEventListener("message", onMessage);
        frameReadyPromise = null;
        frameElement = null;
        frame.remove();
        reject(new Error("Google Fraud Defense initialization timed out."));
      }
    }, 20000);
  });
  return frameReadyPromise;
}

export async function getFraudDefenseToken(action) {
  if (!/^[A-Za-z0-9_]{2,64}$/.test(action)) throw new Error("Invalid Fraud Defense action.");
  const frame = await getFraudDefenseFrame();
  const requestId = "fd_" + (++nextRequestId) + "_" + Date.now();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error("Google Fraud Defense token request timed out."));
    }, 20000);
    pendingRequests.set(requestId, { resolve, reject, timeout });
    frame.contentWindow.postMessage({
      type: "tempoya-fraud-token-request",
      requestId,
      action
    }, window.location.origin);
  });
}
