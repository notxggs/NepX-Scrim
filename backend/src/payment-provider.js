const API_BASE_URL = "https://api.paybridgenp.com/v1";
const DEFAULT_APP_URL = "https://free-fire-tournment-app-a2de9.web.app";

function requiredSecret(name) {
  const value = process.env[name];
  if (!value) {
    const error = new Error(`${name} is not configured.`);
    error.code = "PAYMENT_PROVIDER_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }
  return value;
}

async function request(path, options = {}) {
  const apiKey = requiredSecret("PAYBRIDGENP_API_KEY");
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
  } catch (error) {
    const wrapped = new Error("Could not reach PayBridgeNP.");
    wrapped.code = "PAYBRIDGENP_UNAVAILABLE";
    wrapped.cause = error;
    throw wrapped;
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const requestId = response.headers.get("x-request-id") || body?.error?.request_id;
    console.error("PayBridgeNP request failed:", {
      status: response.status,
      code: body?.error?.code,
      requestId
    });
    const error = new Error(body?.error?.message || "PayBridgeNP rejected the request.");
    error.code = "PAYBRIDGENP_REQUEST_FAILED";
    error.status = response.status >= 500 || response.status === 429 ? 503 : 502;
    throw error;
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("PayBridgeNP returned an invalid response.");
    error.code = "PAYBRIDGENP_INVALID_RESPONSE";
    error.status = 502;
    throw error;
  }
  return body;
}

function returnUrl(embedOrigin) {
  const configuredUrl = embedOrigin || process.env.APP_PUBLIC_URL || DEFAULT_APP_URL;
  let parsed;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error("The checkout return URL must be a valid URL.");
  }
  const localHttpOrigin = parsed.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !localHttpOrigin) {
    throw new Error("The checkout return URL must use HTTPS, except for local development.");
  }
  return parsed.toString();
}

function normalizeTerminalStatus(status) {
  if (status === "success") return "paid";
  if (["failed", "cancelled", "expired"].includes(status)) return "failed";
  if (["pending", "initiated", "processing"].includes(status)) return "pending";
  return null;
}

module.exports = {
  async createCheckout({
    uid,
    sessionId,
    amountPaisa,
    currency,
    customer,
    embedOrigin,
    purpose = "wallet_topup"
  }) {
    const session = await request("/checkout", {
      method: "POST",
      headers: { "Idempotency-Key": sessionId },
      body: JSON.stringify({
        amount: amountPaisa,
        currency,
        returnUrl: returnUrl(embedOrigin),
        ...(embedOrigin ? { embedOrigin } : {}),
        description: purpose === "game_topup" ? "Game currency top-up" : "Wallet top-up",
        metadata: {
          app_uid: uid,
          app_session_id: sessionId,
          app_purpose: purpose
        },
        ...(customer && Object.values(customer).some((value) => value)
          ? { customer }
          : {})
      })
    });
    if (typeof session.id !== "string" || typeof session.checkout_url !== "string") {
      const error = new Error("PayBridgeNP returned an incomplete checkout session.");
      error.code = "PAYBRIDGENP_INVALID_RESPONSE";
      error.status = 502;
      throw error;
    }
    return {
      checkoutUrl: session.checkout_url,
      providerSessionId: session.id
    };
  },

  async verifyPayment({
    uid,
    sessionId,
    providerSessionId,
    amountNpr,
    purpose = "wallet_topup"
  }) {
    const session = await request(`/sessions/${encodeURIComponent(providerSessionId)}`);
    const metadata = session.metadata || {};
    if (session.id !== providerSessionId ||
        metadata.app_uid !== uid ||
        metadata.app_session_id !== sessionId ||
        metadata.app_purpose !== purpose ||
        Number(session.amount) !== Number(amountNpr) * 100 ||
        session.currency !== "NPR") {
      const error = new Error("PayBridgeNP checkout session does not match the pending order.");
      error.code = "PAYMENT_DETAILS_MISMATCH";
      error.status = 502;
      throw error;
    }

    const status = normalizeTerminalStatus(session.status);
    if (!status) {
      const error = new Error("PayBridgeNP returned an unknown checkout status.");
      error.code = "PAYBRIDGENP_INVALID_RESPONSE";
      error.status = 502;
      throw error;
    }
    if (status !== "paid") {
      return { status, sessionId };
    }
    if (typeof session.paymentId !== "string" || !session.paymentId) {
      const error = new Error("PayBridgeNP marked the session successful without a payment ID.");
      error.code = "PAYBRIDGENP_INVALID_RESPONSE";
      error.status = 502;
      throw error;
    }

    const payment = await request(`/payments/${encodeURIComponent(session.paymentId)}`);
    if (payment.id !== session.paymentId ||
        payment.checkoutSessionId !== providerSessionId ||
        payment.status !== "success" ||
        Number(payment.amount) !== Number(amountNpr) * 100 ||
        payment.currency !== "NPR" ||
        payment.metadata?.app_uid !== uid ||
        payment.metadata?.app_session_id !== sessionId ||
        payment.metadata?.app_purpose !== purpose) {
      const error = new Error("PayBridgeNP payment details do not match the pending order.");
      error.code = "PAYMENT_DETAILS_MISMATCH";
      error.status = 502;
      throw error;
    }
    return {
      status: "paid",
      sessionId,
      amountNpr: Number(payment.amount) / 100,
      currency: payment.currency,
      providerTransactionId: payment.id,
      providerReference: payment.providerRef || null
    };
  }
};
