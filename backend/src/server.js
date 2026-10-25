require("dotenv").config();

const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { applicationDefault, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getDatabase, ServerValue } = require("firebase-admin/database");
const { getStorage } = require("firebase-admin/storage");
const multer = require("multer");

const paymentProvider = require("./payment-provider");

const projectFirebaseConfig = process.env.FIREBASE_CONFIG
  ? JSON.parse(process.env.FIREBASE_CONFIG)
  : {};
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID ||
  projectFirebaseConfig.projectId ||
  "free-fire-tournment-app-a2de9";
const databaseUrl = process.env.FIREBASE_DATABASE_URL ||
  projectFirebaseConfig.databaseURL ||
  "https://free-fire-tournment-app-a2de9-default-rtdb.asia-southeast1.firebasedatabase.app";
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ||
  projectFirebaseConfig.storageBucket ||
  "free-fire-tournment-app-a2de9.firebasestorage.app";
const minTopupNpr = Number(process.env.MIN_TOPUP_NPR || 50);
const maxTopupNpr = Number(process.env.MAX_TOPUP_NPR || 100000);
const minWithdrawNpr = Number(process.env.MIN_WITHDRAW_NPR || 50);
if (!Number.isSafeInteger(minTopupNpr) || minTopupNpr < 1 ||
    !Number.isSafeInteger(maxTopupNpr) || maxTopupNpr < minTopupNpr ||
    !Number.isSafeInteger(minWithdrawNpr) || minWithdrawNpr < 1) {
  throw new Error("Top-up and withdrawal limits must be valid positive whole NPR values.");
}

initializeApp({
  credential: applicationDefault(),
  projectId: firebaseProjectId,
  databaseURL: databaseUrl,
  storageBucket
});

const db = getDatabase();
const app = express();
const reportUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3, fields: 2, fieldSize: 2000 }
});
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1 }
});
const reportSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
const imageUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.uid,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
const reportFileTypes = {
  "application/pdf": { extension: "pdf", matches: (buffer) => buffer.subarray(0, 5).toString() === "%PDF-" },
  "image/jpeg": { extension: "jpg", matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: "png", matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { extension: "webp", matches: (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP" }
};
const imageFileTypes = {
  "image/jpeg": {
    extension: "jpg",
    matches: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
  },
  "image/png": {
    extension: "png",
    matches: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  },
  "image/webp": {
    extension: "webp",
    matches: (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP"
  },
  "image/gif": {
    extension: "gif",
    matches: (buffer) => ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString())
  }
};
const topupMethods = new Set([
  "nepal_gateway",
  "esewa",
  "khalti",
  "fonepay",
  "nepalpay_qr",
  "mobile_banking"
]);
const withdrawalMethods = new Set(["esewa", "khalti", "fonepay", "mobile_banking"]);
const serverTimestamp = ServerValue.TIMESTAMP;

app.disable("x-powered-by");
app.use(helmet());
if (process.env.FRONTEND_ORIGIN) {
  const allowedOrigins = process.env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim());
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.push("http://localhost:5500", "http://127.0.0.1:5500");
  }
  app.use(cors({ origin: allowedOrigins }));
}
app.use(express.json({
  limit: "32kb",
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  }
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
app.use("/api", apiLimiter);

function httpError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

async function requireFirebaseUser(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer (.+)$/);
  if (!match) {
    return next(httpError(401, "A Firebase ID token is required.", "AUTH_REQUIRED"));
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1], true);
    req.uid = decoded.uid;
    return next();
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "UNKNOWN";
    console.error("Firebase ID token verification failed:", { code });
    if (["app/invalid-credential", "app/invalid-app-credential", "auth/insufficient-permission"]
      .includes(code)) {
      return next(httpError(
        503,
        "Firebase Admin credentials are not available for the configured project. Configure local Google credentials and restart the backend.",
        "FIREBASE_ADMIN_NOT_CONFIGURED"
      ));
    }
    return next(httpError(401, "The Firebase ID token is invalid or expired.", "AUTH_INVALID"));
  }
}

function readPositiveInteger(value, name, maximum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0 || number > maximum) {
    throw httpError(400, `${name} must be a positive whole number.`, "INVALID_INPUT");
  }
  return number;
}

function readRequestId(value) {
  if (typeof value !== "string" || !/^[a-f0-9-]{36}$/i.test(value)) {
    throw httpError(400, "A valid idempotency requestId is required.", "INVALID_REQUEST_ID");
  }
  return value;
}

function walletOperationKey(id) {
  const operationHashSecret = process.env.OPERATION_HASH_SECRET;
  if (!operationHashSecret || Buffer.byteLength(operationHashSecret) < 32) {
    throw httpError(500, "OPERATION_HASH_SECRET must contain at least 32 bytes.", "OPERATION_SECRET_NOT_CONFIGURED");
  }
  return crypto.createHmac("sha256", operationHashSecret).update(id).digest("hex");
}

function readProfileText(value, name, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw httpError(400, `${name} is invalid.`, "INVALID_INPUT");
  }
  return value.trim();
}

function readOptionalPaymentContact(value, name, maxLength) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw httpError(500, `The account profile contains an invalid ${name}.`, "INVALID_PROFILE");
  }
  return value.trim() || undefined;
}

async function getPaymentCustomer(uid) {
  const [profileSnapshot, authUser] = await Promise.all([
    db.ref(`users/${uid}`).get(),
    getAuth().getUser(uid)
  ]);
  if (!profileSnapshot.exists()) {
    throw httpError(404, "Your account profile could not be found.", "PROFILE_NOT_FOUND");
  }
  const profile = profileSnapshot.val();
  return {
    name: readOptionalPaymentContact(profile.displayName || authUser.displayName, "name", 120),
    email: readOptionalPaymentContact(profile.email || authUser.email, "email", 254),
    phone: readOptionalPaymentContact(profile.phoneNumber || authUser.phoneNumber, "phone number", 40)
  };
}

function ensurePaymentProvider() {
  if (!paymentProvider ||
      typeof paymentProvider.createCheckout !== "function" ||
      typeof paymentProvider.verifyPayment !== "function") {
    throw httpError(
      503,
      "Nepal payment gateway is not configured. Checkout is disabled until a verified provider adapter is installed.",
      "PAYMENT_PROVIDER_NOT_CONFIGURED"
    );
  }
  return paymentProvider;
}

function parseReportUpload(req, res, next) {
  reportUpload.array("attachments", 3)(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return next(httpError(status, error.code === "LIMIT_FILE_SIZE"
        ? "Each attachment must be 5 MB or smaller."
        : "Attach no more than 3 files.", error.code));
    }
    return next(error);
  });
}

function parseImageUpload(req, res, next) {
  imageUpload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return next(httpError(status, error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : "Upload exactly one image.", error.code));
    }
    return next(error);
  });
}

async function requireDesignatedAdminOrActiveStaff(req, res, next) {
  try {
    const [adminSnapshot, staffSnapshot] = await Promise.all([
      db.ref("adminConfig/adminUid").get(),
      db.ref(`staff/${req.uid}`).get()
    ]);
    if (adminSnapshot.val() === req.uid || staffSnapshot.val()?.status === "active") {
      return next();
    }
    return next(httpError(403, "An active admin or staff account is required.", "ADMIN_OR_STAFF_REQUIRED"));
  } catch (error) {
    return next(error);
  }
}

function validateImageFile(file) {
  if (!file) throw httpError(400, "Select an image file.", "IMAGE_REQUIRED");
  const type = imageFileTypes[file.mimetype];
  if (!type || !type.matches(file.buffer)) {
    throw httpError(400, "Upload a valid JPEG, PNG, WEBP, or GIF image.", "INVALID_IMAGE");
  }
  return type;
}

async function storePublicImage(file, folder, uid) {
  const type = validateImageFile(file);
  const token = crypto.randomUUID();
  const objectPath = `${folder}/${uid}/${crypto.randomUUID()}.${type.extension}`;
  await getStorage().bucket(storageBucket).file(objectPath).save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
      cacheControl: "public, max-age=31536000, immutable",
      metadata: { firebaseStorageDownloadTokens: token }
    }
  });
  const encodedPath = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${encodedPath}?alt=media&token=${token}`;
}

function validateReportFile(file) {
  const type = reportFileTypes[file.mimetype];
  if (!type || !type.matches(file.buffer)) {
    throw httpError(400, "Attachments must be valid PDF, JPEG, PNG, or WEBP files.", "INVALID_ATTACHMENT");
  }
  return type;
}

function validateCheckoutUrl(value) {
  let checkoutUrl;
  try {
    checkoutUrl = new URL(value);
  } catch {
    throw httpError(502, "The payment provider returned an invalid checkout URL.", "INVALID_PROVIDER_RESPONSE");
  }
  if (checkoutUrl.protocol !== "https:") {
    throw httpError(502, "The payment provider checkout URL must use HTTPS.", "INVALID_PROVIDER_RESPONSE");
  }
  const allowedHosts = new Set((process.env.PAYMENT_CHECKOUT_HOSTS || "checkout.paybridgenp.com")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean));
  if (allowedHosts.size === 0) {
    throw httpError(503, "PAYMENT_CHECKOUT_HOSTS must be configured before checkout is enabled.", "PAYMENT_HOSTS_NOT_CONFIGURED");
  }
  if (!allowedHosts.has(checkoutUrl.hostname.toLowerCase())) {
    throw httpError(502, "The payment provider returned a checkout host that is not allowed.", "INVALID_PROVIDER_RESPONSE");
  }
  return checkoutUrl.toString();
}

function getCheckoutEmbedOrigin(req) {
  const origin = req.get("origin");
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin).origin;
  } catch {
    throw httpError(400, "A valid checkout page origin is required.", "INVALID_EMBED_ORIGIN");
  }

  const allowedOrigins = new Set(
    (process.env.PAYBRIDGE_EMBED_ORIGINS || process.env.FRONTEND_ORIGIN || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  if (process.env.NODE_ENV !== "production") {
    allowedOrigins.add("http://localhost:5500");
    allowedOrigins.add("http://127.0.0.1:5500");
  }
  if (!allowedOrigins.has(parsedOrigin)) {
    throw httpError(400, "This app origin is not enabled for embedded PayBridgeNP checkout.", "EMBED_ORIGIN_NOT_ALLOWED");
  }
  return parsedOrigin;
}

async function updateWallet(uid, callback) {
  const result = await db.ref(`users/${uid}`).transaction((profile) => callback(profile), undefined, false);
  if (!result.committed || !result.snapshot.exists()) {
    throw httpError(409, "The wallet operation could not be completed.", "WALLET_UPDATE_FAILED");
  }
  return result.snapshot.val();
}

function writeTransaction(uid, transactionId, transaction) {
  return db.ref(`transactions/${uid}/${transactionId}`).set(transaction);
}

async function settleWalletTopup(uid, sessionId, topup, verification) {
  if (!verification || !["paid", "pending", "failed"].includes(verification.status) ||
      verification.sessionId !== sessionId) {
    throw httpError(502, "The provider verification does not match this payment session.", "PAYMENT_DETAILS_MISMATCH");
  }
  const topupRef = db.ref(`walletTopups/${uid}/${sessionId}`);
  if (verification.status === "pending") return "pending";
  if (verification.status === "failed") {
    await topupRef.transaction((current) => {
      if (current?.status === "pending") return { ...current, status: "failed", verifiedAt: serverTimestamp };
      return current;
    }, undefined, false);
    return (await topupRef.get()).val()?.status || "failed";
  }
  if (Number(verification.amountNpr) !== Number(topup.amount) ||
      verification.currency !== "NPR" ||
      typeof verification.providerTransactionId !== "string" ||
      verification.providerTransactionId.length === 0) {
    throw httpError(502, "Verified payment details do not match the top-up order.", "PAYMENT_DETAILS_MISMATCH");
  }

  const providerClaimRef = db.ref(`providerPaymentClaims/${walletOperationKey(verification.providerTransactionId)}`);
  const providerClaim = await providerClaimRef.transaction((claim) => {
    if (claim && (claim.sessionId !== sessionId || claim.uid !== uid)) return;
    return { sessionId, uid, createdAt: claim?.createdAt || serverTimestamp };
  }, undefined, false);
  if (!providerClaim.committed) {
    throw httpError(409, "This provider transaction has already been used.", "DUPLICATE_PROVIDER_TRANSACTION");
  }

  const profile = await updateWallet(uid, (current) => {
    if (!current) return;
    current.walletCredits = current.walletCredits || {};
    const creditKey = walletOperationKey(sessionId);
    const priorCredit = current.walletCredits[creditKey];
    if (priorCredit) {
      if (Number(priorCredit.amount) !== Number(topup.amount) ||
          priorCredit.providerTransactionHash !== walletOperationKey(verification.providerTransactionId)) {
        throw httpError(409, "Payment session was already applied with different details.", "CREDIT_MISMATCH");
      }
      return current;
    }
    current.balance = Number(current.balance || 0) + Number(topup.amount);
    current.walletCredits[creditKey] = {
      type: "topup",
      amount: Number(topup.amount),
      paymentMethod: topup.paymentMethod,
      providerTransactionHash: walletOperationKey(verification.providerTransactionId),
      createdAt: serverTimestamp
    };
    return current;
  });
  await Promise.all([
    topupRef.update({
      status: "completed",
      transactionId: verification.providerTransactionId,
      providerReference: verification.providerReference || null,
      verifiedAt: serverTimestamp
    }),
    writeTransaction(uid, sessionId, {
      type: "topup",
      amount: Number(topup.amount),
      description: `Wallet top-up (${topup.paymentMethod})`,
      timestamp: serverTimestamp,
      status: "completed",
      paymentMethod: topup.paymentMethod,
      sessionId,
      transactionId: verification.providerTransactionId,
      balanceAfter: Number(profile.balance || 0)
    })
  ]);
  return "completed";
}

async function verifyAndSettleWalletTopup(uid, sessionId, topup) {
  const provider = ensurePaymentProvider();
  const verification = await provider.verifyPayment({
    uid,
    sessionId,
    providerSessionId: topup.providerSessionId,
    amountNpr: topup.amount,
    paymentMethod: topup.paymentMethod,
    purpose: "wallet_topup"
  });
  return settleWalletTopup(uid, sessionId, topup, verification);
}

async function settleGameTopup(uid, sessionId, order, verification) {
  if (!verification || !["paid", "pending", "failed"].includes(verification.status) ||
      verification.sessionId !== sessionId) {
    throw httpError(502, "The provider verification does not match this order.", "PAYMENT_DETAILS_MISMATCH");
  }
  const orderRef = db.ref(`gameTopupOrders/${uid}/${sessionId}`);
  if (verification.status === "pending") return "pending";
  if (verification.status === "failed") {
    await orderRef.transaction((current) => {
      if (current?.status === "pending") return { ...current, status: "failed", verifiedAt: serverTimestamp };
      return current;
    }, undefined, false);
    return (await orderRef.get()).val()?.status || "failed";
  }
  if (Number(verification.amountNpr) !== Number(order.priceNpr) ||
      verification.currency !== "NPR" ||
      typeof verification.providerTransactionId !== "string" ||
      verification.providerTransactionId.length === 0) {
    throw httpError(502, "Verified payment details do not match the game top-up order.", "PAYMENT_DETAILS_MISMATCH");
  }

  const providerClaimRef = db.ref(`providerPaymentClaims/${walletOperationKey(verification.providerTransactionId)}`);
  const providerClaim = await providerClaimRef.transaction((claim) => {
    if (claim && (claim.sessionId !== sessionId || claim.uid !== uid)) return;
    return {
      sessionId,
      uid,
      purpose: "game_topup",
      createdAt: claim?.createdAt || serverTimestamp
    };
  }, undefined, false);
  if (!providerClaim.committed) {
    throw httpError(409, "This provider transaction has already been used.", "DUPLICATE_PROVIDER_TRANSACTION");
  }

  const result = await orderRef.transaction((current) => {
    if (!current || current.status !== "pending") return current;
    return {
      ...current,
      status: "awaiting_fulfillment",
      transactionId: verification.providerTransactionId,
      providerReference: verification.providerReference || null,
      verifiedAt: serverTimestamp
    };
  }, undefined, false);
  return result.snapshot.val()?.status || "pending";
}

async function verifyAndSettleGameTopup(uid, sessionId, order) {
  const provider = ensurePaymentProvider();
  const verification = await provider.verifyPayment({
    uid,
    sessionId,
    providerSessionId: order.providerSessionId,
    amountNpr: order.priceNpr,
    paymentMethod: order.paymentMethod,
    purpose: "game_topup"
  });
  return settleGameTopup(uid, sessionId, order, verification);
}

function verifiedPayBridgeEvent(rawBody, signatureHeader, secret) {
  if (!Buffer.isBuffer(rawBody) || typeof signatureHeader !== "string" || !secret) {
    throw httpError(400, "Webhook signature is missing or malformed.", "INVALID_WEBHOOK_SIGNATURE");
  }
  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const separator = part.indexOf("=");
    return separator < 0 ? ["", ""] : [part.slice(0, separator), part.slice(separator + 1)];
  }));
  const timestamp = Number(parts.t);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300 ||
      !/^[a-f0-9]{64}$/i.test(parts.v1 || "")) {
    throw httpError(400, "Webhook signature is invalid or expired.", "INVALID_WEBHOOK_SIGNATURE");
  }
  const expected = crypto.createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody.toString("utf8")}`)
    .digest();
  const received = Buffer.from(parts.v1, "hex");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    throw httpError(400, "Webhook signature verification failed.", "INVALID_WEBHOOK_SIGNATURE");
  }
  try {
    return JSON.parse(rawBody.toString("utf8"));
  } catch {
    throw httpError(400, "Webhook body must be valid JSON.", "INVALID_WEBHOOK_BODY");
  }
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/webhooks/paybridgenp", asyncRoute(async (req, res) => {
  const webhookSecret = process.env.PAYBRIDGENP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw httpError(503, "PayBridgeNP webhook signing secret is not configured.", "WEBHOOK_SECRET_NOT_CONFIGURED");
  }
  const event = verifiedPayBridgeEvent(
    req.rawBody,
    req.get("x-paybridgenp-signature"),
    webhookSecret
  );
  if (typeof event.id !== "string" || typeof event.type !== "string" || !event.data) {
    throw httpError(400, "PayBridgeNP webhook event is malformed.", "INVALID_WEBHOOK_BODY");
  }
  if (!["payment.succeeded", "payment.failed", "payment.cancelled"].includes(event.type)) {
    return res.json({ received: true, ignored: true });
  }

  const payment = event.data;
  const metadata = payment.metadata || {};
  const uid = metadata.app_uid;
  const sessionId = metadata.app_session_id;
  const purpose = metadata.app_purpose;
  const providerSessionId = payment.session_id || payment.checkoutSessionId;
  if (typeof uid !== "string" || typeof sessionId !== "string" ||
      !/^[a-f0-9-]{36}$/i.test(sessionId) ||
      !["wallet_topup", "game_topup"].includes(purpose) ||
      typeof providerSessionId !== "string") {
    throw httpError(400, "PayBridgeNP webhook is missing the application order reference.", "INVALID_WEBHOOK_ORDER");
  }

  if (purpose === "wallet_topup") {
    const topupRef = db.ref(`walletTopups/${uid}/${sessionId}`);
    const snapshot = await topupRef.get();
    if (!snapshot.exists() || snapshot.val().providerSessionId !== providerSessionId) {
      throw httpError(404, "The payment session is not linked to a wallet top-up.", "TOPUP_NOT_FOUND");
    }
    const topup = snapshot.val();
    if (topup.status === "pending") {
      await verifyAndSettleWalletTopup(uid, sessionId, topup);
    }
  } else {
    const orderRef = db.ref(`gameTopupOrders/${uid}/${sessionId}`);
    const snapshot = await orderRef.get();
    if (!snapshot.exists() || snapshot.val().providerSessionId !== providerSessionId) {
      throw httpError(404, "The payment session is not linked to a game top-up.", "GAME_TOPUP_NOT_FOUND");
    }
    const order = snapshot.val();
    if (order.status === "pending") {
      await verifyAndSettleGameTopup(uid, sessionId, order);
    }
  }
  return res.json({ received: true });
}));

app.post("/api/uploads/avatar", requireFirebaseUser, imageUploadLimiter, parseImageUpload, asyncRoute(async (req, res) => {
  const photoURL = await storePublicImage(req.file, "user-avatars", req.uid);
  return res.status(201).json({ success: true, imageUrl: photoURL });
}));

app.post("/api/admin/uploads/image", requireFirebaseUser, requireDesignatedAdminOrActiveStaff, imageUploadLimiter, parseImageUpload, asyncRoute(async (req, res) => {
  const imageUrl = await storePublicImage(req.file, "public-assets", req.uid);
  return res.status(201).json({ success: true, imageUrl });
}));

app.post("/api/reports", requireFirebaseUser, reportSubmissionLimiter, parseReportUpload, asyncRoute(async (req, res) => {
  const reportType = req.body?.reportType;
  const reportTypes = new Set(["user_hacking", "payment_not_received", "mistake", "other"]);
  if (!reportTypes.has(reportType)) {
    throw httpError(400, "Choose a valid report category.", "INVALID_REPORT_TYPE");
  }
  const description = req.body?.description;
  if (typeof description !== "string" || description.trim().length < 10 || description.trim().length > 2000) {
    throw httpError(400, "Describe the issue in 10 to 2000 characters.", "INVALID_REPORT_DESCRIPTION");
  }

  const files = req.files || [];
  const validatedFiles = files.map((file) => ({ file, type: validateReportFile(file) }));
  const authUser = await getAuth().getUser(req.uid);
  const reportsRef = db.ref(`supportReports/${req.uid}`);
  const reportRef = reportsRef.push();
  const reportId = reportRef.key;
  const uploadedPaths = [];
  const attachments = {};

  try {
    for (const { file, type } of validatedFiles) {
      const attachmentId = crypto.randomUUID();
      const storagePath = `support-reports/${req.uid}/${reportId}/${attachmentId}.${type.extension}`;
      const bucket = getStorage().bucket(storageBucket);
      await bucket.file(storagePath).save(file.buffer, {
        resumable: false,
        metadata: {
          contentType: file.mimetype,
          contentDisposition: "attachment",
          cacheControl: "private, no-store",
          metadata: { uid: req.uid, reportId, attachmentId }
        }
      });
      uploadedPaths.push(storagePath);
      attachments[attachmentId] = {
        originalName: file.originalname.slice(0, 180),
        contentType: file.mimetype,
        size: file.size,
        storagePath
      };
    }

    await reportRef.set({
      reportId,
      uid: req.uid,
      userName: authUser.displayName || "",
      userEmail: authUser.email || "",
      reportType,
      description: description.trim(),
      attachments,
      status: "open",
      createdAt: serverTimestamp
    });
  } catch (error) {
    const cleanupResults = await Promise.allSettled(uploadedPaths.map((path) =>
      getStorage().bucket(storageBucket).file(path).delete({ ignoreNotFound: true })
    ));
    cleanupResults.forEach((result) => {
      if (result.status === "rejected") console.error("Failed to clean up report attachment:", result.reason);
    });
    throw error;
  }

  return res.status(201).json({ success: true, reportId, status: "open" });
}));

app.get("/api/admin/support-reports/:uid/:reportId/attachments/:attachmentId", requireFirebaseUser, asyncRoute(async (req, res) => {
  const { uid, reportId, attachmentId } = req.params;
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(reportId) ||
      !/^[a-f0-9-]{36}$/i.test(attachmentId)) {
    throw httpError(400, "Invalid report attachment reference.", "INVALID_ATTACHMENT_REFERENCE");
  }
  const adminUid = await db.ref("adminConfig/adminUid").get();
  if (!adminUid.exists() || adminUid.val() !== req.uid) {
    throw httpError(403, "Only the designated admin can download report attachments.", "ADMIN_REQUIRED");
  }
  const attachmentSnapshot = await db.ref(`supportReports/${uid}/${reportId}/attachments/${attachmentId}`).get();
  if (!attachmentSnapshot.exists()) {
    throw httpError(404, "Report attachment not found.", "ATTACHMENT_NOT_FOUND");
  }
  const attachment = attachmentSnapshot.val();
  const storagePath = attachment.storagePath;
  const expectedPrefix = `support-reports/${uid}/${reportId}/`;
  if (typeof storagePath !== "string" || !storagePath.startsWith(expectedPrefix)) {
    throw httpError(500, "Report attachment storage reference is invalid.", "INVALID_ATTACHMENT_STORAGE");
  }
  let contents;
  try {
    [contents] = await getStorage()
      .bucket(storageBucket)
      .file(storagePath)
      .download();
  } catch (error) {
    if (error.code === 404) throw httpError(404, "Report attachment is no longer available.", "ATTACHMENT_NOT_FOUND");
    throw error;
  }
  const extension = reportFileTypes[attachment.contentType]?.extension || "bin";
  res.set({
    "Content-Type": attachment.contentType,
    "Content-Disposition": `attachment; filename="report-${attachmentId}.${extension}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff"
  });
  return res.send(contents);
}));

app.post("/api/profile/initialize", requireFirebaseUser, asyncRoute(async (req, res) => {
  const authUser = await getAuth().getUser(req.uid);
  const profileInput = req.body && req.body.profile ? req.body.profile : {};
  const displayName = typeof profileInput.displayName === "string"
    ? profileInput.displayName.trim().slice(0, 80)
    : "";
  const phoneNumber = typeof profileInput.phoneNumber === "string"
    ? profileInput.phoneNumber.trim().slice(0, 30)
    : "";
  const referralCode = typeof profileInput.referralCode === "string"
    ? profileInput.referralCode.trim().slice(0, 32)
    : "";
  let referrerUid = null;
  if (referralCode) {
    const referrerSnapshot = await db.ref("users")
      .orderByChild("referralCode")
      .equalTo(referralCode)
      .limitToFirst(1)
      .get();
    if (referrerSnapshot.exists()) {
      const referrerId = Object.keys(referrerSnapshot.val())[0];
      if (referrerId !== req.uid) referrerUid = referrerId;
    }
  }
  const settingsSnapshot = await db.ref("settings/signupBonus").get();
  const configuredBonus = settingsSnapshot.exists()
    ? Number(settingsSnapshot.val())
    : Number(process.env.SIGNUP_BONUS_NPR || 10);
  if (!Number.isSafeInteger(configuredBonus) || configuredBonus < 0 || configuredBonus > 100000) {
    throw httpError(500, "Configured signup bonus must be a whole NPR amount from 0 to 100000.", "INVALID_SIGNUP_BONUS");
  }
  const signupBonus = configuredBonus;
  const profileRef = db.ref(`users/${req.uid}`);
  let created = false;
  let createdProfile;

  const result = await profileRef.transaction((existing) => {
    if (existing) return;
    created = true;
    const name = displayName || authUser.displayName || authUser.email?.split("@")[0] || `User${req.uid.slice(0, 5)}`;
    createdProfile = {
      uid: req.uid,
      displayName: name,
      email: authUser.email || null,
      phoneNumber: phoneNumber || authUser.phoneNumber || null,
      photoURL: authUser.photoURL || null,
      isAdmin: false,
      balance: signupBonus,
      winningCash: 0,
      bonusCash: signupBonus,
      totalMatches: 0,
      wonMatches: 0,
      totalEarnings: 0,
      referralEarnings: 0,
      createdAt: serverTimestamp,
      referralCode: req.uid.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase(),
      joinedTournaments: {},
      lastCheckedNotifications: Date.now(),
      lastLogin: serverTimestamp
    };
    if (referrerUid) createdProfile.referredBy = referrerUid;
    if (signupBonus > 0) {
      createdProfile.walletCredits = {
        [walletOperationKey("signup")]: { type: "signup_bonus", amount: signupBonus, createdAt: serverTimestamp }
      };
    }
    return createdProfile;
  });

  if (!result.committed) {
    const existingProfile = result.snapshot.val();
    if (existingProfile?.referredBy) {
      const referralRef = db.ref(`pendingReferrals/${req.uid}`);
      const pendingReferral = await referralRef.get();
      if (!pendingReferral.exists()) {
        const referrerSnapshot = await db.ref(`users/${existingProfile.referredBy}`).get();
        const referrer = referrerSnapshot.val() || {};
        await referralRef.set({
          referrerUid: existingProfile.referredBy,
          referrerEmail: referrer.email || "",
          referredUid: req.uid,
          referredEmail: authUser.email || "",
          status: "pending",
          timestamp: serverTimestamp
        });
      }
    }
    return res.json({ success: true, created: false, profile: existingProfile });
  }
  if (created && signupBonus > 0) {
    await writeTransaction(req.uid, "signup-bonus", {
      type: "signup_bonus",
      amount: signupBonus,
      description: "Welcome Bonus",
      timestamp: serverTimestamp,
      status: "completed"
    });
  }
  if (createdProfile.referredBy) {
    const referrerSnapshot = await db.ref(`users/${createdProfile.referredBy}`).get();
    const referrer = referrerSnapshot.val() || {};
    await db.ref(`pendingReferrals/${req.uid}`).set({
      referrerUid: createdProfile.referredBy,
      referrerEmail: referrer.email || "",
      referredUid: req.uid,
      referredEmail: authUser.email || "",
      status: "pending",
      timestamp: serverTimestamp
    });
  }
  return res.status(201).json({ success: true, created: true, profile: createdProfile });
}));

app.get("/api/leaderboard", requireFirebaseUser, asyncRoute(async (req, res) => {
  const snapshot = await db.ref("users").orderByChild("leaderboardRank").limitToFirst(100).get();
  const leaderboard = [];
  snapshot.forEach((child) => {
    const user = child.val();
    if (user && Number.isFinite(Number(user.leaderboardRank)) && Number(user.leaderboardRank) > 0) {
      leaderboard.push({
        leaderboardRank: Number(user.leaderboardRank),
        displayName: typeof user.displayName === "string" ? user.displayName.slice(0, 80) : "User",
        photoURL: typeof user.photoURL === "string" && user.photoURL.startsWith("https://") ? user.photoURL : "",
        leaderboardDisplayEarnings: Number(user.leaderboardDisplayEarnings) || 0
      });
    }
  });
  leaderboard.sort((left, right) => left.leaderboardRank - right.leaderboardRank);
  return res.json({ success: true, leaderboard });
}));

app.post("/api/game-topups", requireFirebaseUser, asyncRoute(async (req, res) => {
  const provider = ensurePaymentProvider();
  const gameId = readProfileText(req.body?.gameId, "gameId", 128);
  const packageId = readProfileText(req.body?.packageId, "packageId", 128);
  const playerId = readProfileText(req.body?.playerId, "playerId", 80);
  const serverId = typeof req.body?.serverId === "string" ? req.body.serverId.trim().slice(0, 40) : "";
  const [gameSnapshot, catalogSnapshot] = await Promise.all([
    db.ref(`games/${gameId}`).get(),
    db.ref(`settings/gameTopupCatalog/${gameId}/${packageId}`).get()
  ]);
  if (!gameSnapshot.exists()) throw httpError(400, "That game is not available.", "GAME_NOT_FOUND");
  const game = gameSnapshot.val();
  if (!game?.name || !catalogSnapshot.exists()) {
    throw httpError(400, "That game top-up package is not available.", "PACKAGE_NOT_FOUND");
  }
  const product = catalogSnapshot.val();
  const amountNpr = Number(product.priceNpr);
  const units = Number(product.units);
  if (!Number.isSafeInteger(amountNpr) || amountNpr < minTopupNpr ||
      amountNpr > maxTopupNpr || !Number.isSafeInteger(units) || units < 1 ||
      typeof product.name !== "string" || !product.name.trim()) {
    throw httpError(503, "This game top-up package is not configured correctly.", "INVALID_GAME_PACKAGE");
  }
  const customer = await getPaymentCustomer(req.uid);
  const sessionId = crypto.randomUUID();
  const paymentMethod = "nepal_gateway";
  const providerSession = await provider.createCheckout({
    uid: req.uid,
    sessionId,
    amountNpr,
    amountPaisa: amountNpr * 100,
    currency: "NPR",
    paymentMethod,
    embedOrigin: getCheckoutEmbedOrigin(req),
    customer,
    purpose: "game_topup",
    gameId,
    gameName: String(game.name).slice(0, 80),
    packageId,
    packageName: product.name.trim().slice(0, 100),
    units,
    playerId,
    serverId
  });
  if (!providerSession || typeof providerSession.checkoutUrl !== "string") {
    throw httpError(502, "The payment provider could not create checkout.", "PROVIDER_CHECKOUT_FAILED");
  }

  const checkoutUrl = validateCheckoutUrl(providerSession.checkoutUrl);
  await db.ref(`gameTopupOrders/${req.uid}/${sessionId}`).set({
    uid: req.uid,
    sessionId,
    gameId,
    gameName: String(game.name).slice(0, 80),
    packageId,
    packageName: product.name.trim().slice(0, 100),
    units,
    priceNpr: amountNpr,
    currency: "NPR",
    playerId,
    serverId,
    paymentMethod,
    providerSessionId: String(providerSession.providerSessionId || sessionId),
    status: "pending",
    createdAt: serverTimestamp
  });
  return res.status(201).json({ success: true, sessionId, checkoutUrl, status: "pending" });
}));

app.get("/api/game-topups/:sessionId/verify", requireFirebaseUser, asyncRoute(async (req, res) => {
  const { sessionId } = req.params;
  if (!/^[a-f0-9-]{36}$/i.test(sessionId)) {
    throw httpError(400, "Invalid game top-up session ID.", "INVALID_SESSION_ID");
  }
  const orderRef = db.ref(`gameTopupOrders/${req.uid}/${sessionId}`);
  const snapshot = await orderRef.get();
  if (!snapshot.exists()) throw httpError(404, "Game top-up order not found.", "GAME_TOPUP_NOT_FOUND");
  const order = snapshot.val();
  if (order.status !== "pending") {
    return res.json({ success: true, sessionId, status: order.status });
  }
  const status = await verifyAndSettleGameTopup(req.uid, sessionId, order);
  return res.json({ success: true, sessionId, status });
}));

app.post("/api/create-topup", requireFirebaseUser, asyncRoute(async (req, res) => {
  const provider = ensurePaymentProvider();
  const amountNpr = readPositiveInteger(req.body?.amountNpr, "amountNpr", maxTopupNpr);
  const paymentMethod = req.body?.paymentMethod;
  if (amountNpr < minTopupNpr) {
    throw httpError(400, `Minimum top-up is NPR ${minTopupNpr}.`, "AMOUNT_TOO_LOW");
  }
  if (!topupMethods.has(paymentMethod)) {
    throw httpError(400, "Choose a supported Nepal payment method.", "INVALID_PAYMENT_METHOD");
  }

  const customer = await getPaymentCustomer(req.uid);
  const sessionId = crypto.randomUUID();
  const providerSession = await provider.createCheckout({
    uid: req.uid,
    sessionId,
    amountNpr,
    amountPaisa: amountNpr * 100,
    currency: "NPR",
    paymentMethod,
    embedOrigin: getCheckoutEmbedOrigin(req),
    customer
  });
  if (!providerSession || typeof providerSession.checkoutUrl !== "string") {
    throw httpError(502, "The payment provider could not create checkout.", "PROVIDER_CHECKOUT_FAILED");
  }

  const checkoutUrl = validateCheckoutUrl(providerSession.checkoutUrl);
  await db.ref(`walletTopups/${req.uid}/${sessionId}`).set({
    uid: req.uid,
    amount: amountNpr,
    currency: "NPR",
    sessionId,
    providerSessionId: String(providerSession.providerSessionId || sessionId),
    paymentMethod,
    status: "pending",
    createdAt: serverTimestamp
  });
  return res.status(201).json({ success: true, sessionId, checkoutUrl, status: "pending" });
}));

app.get("/api/verify-topup/:sessionId", requireFirebaseUser, asyncRoute(async (req, res) => {
  const sessionId = req.params.sessionId;
  if (!/^[a-f0-9-]{36}$/i.test(sessionId)) {
    throw httpError(400, "Invalid payment session ID.", "INVALID_SESSION_ID");
  }
  const topupRef = db.ref(`walletTopups/${req.uid}/${sessionId}`);
  const snapshot = await topupRef.get();
  if (!snapshot.exists()) {
    throw httpError(404, "Payment session not found.", "TOPUP_NOT_FOUND");
  }
  const topup = snapshot.val();
  if (topup.status === "completed" || topup.status === "failed") {
    return res.json({ success: true, sessionId, status: topup.status });
  }
  const status = await verifyAndSettleWalletTopup(req.uid, sessionId, topup);
  return res.json({ success: true, sessionId, status });
}));

app.post("/api/wallet/withdraw", requireFirebaseUser, asyncRoute(async (req, res) => {
  const requestId = readRequestId(req.body?.requestId);
  const amount = readPositiveInteger(req.body?.amountNpr, "amountNpr", 100000);
  const minimumSnapshot = await db.ref("settings/minWithdraw").get();
  const configuredMinimum = minimumSnapshot.exists() ? Number(minimumSnapshot.val()) : minWithdrawNpr;
  if (!Number.isSafeInteger(configuredMinimum) || configuredMinimum < 1) {
    throw httpError(500, "Configured minimum withdrawal must be a positive whole NPR amount.", "INVALID_WITHDRAWAL_MINIMUM");
  }
  const minimum = configuredMinimum;
  const methodName = readProfileText(req.body?.methodName, "methodName", 40);
  const accountInfo = readProfileText(req.body?.accountInfo, "accountInfo", 120);
  const operationKey = walletOperationKey(requestId);
  if (!withdrawalMethods.has(methodName.toLowerCase())) {
    throw httpError(400, "Choose a supported Nepal withdrawal method.", "INVALID_WITHDRAWAL_METHOD");
  }
  if (amount < minimum) {
    throw httpError(400, `Minimum withdrawal is NPR ${minimum}.`, "AMOUNT_TOO_LOW");
  }

  const profile = await updateWallet(req.uid, (current) => {
    if (!current) return;
    current.walletOperations = current.walletOperations || {};
    const previous = current.walletOperations[operationKey];
    if (previous) {
      if (previous.type !== "withdrawal" ||
          Number(previous.amount) !== amount ||
          previous.methodName !== methodName ||
          previous.accountHash !== walletOperationKey(accountInfo)) {
        throw httpError(409, "Request ID was already used for another wallet operation.", "IDEMPOTENCY_CONFLICT");
      }
      return current;
    }
    if (Number(current.winningCash || 0) < amount || Number(current.balance || 0) < amount) {
      throw httpError(409, "Insufficient withdrawable balance.", "INSUFFICIENT_BALANCE");
    }
    current.winningCash = Number(current.winningCash || 0) - amount;
    current.balance = Number(current.balance || 0) - amount;
    current.walletOperations[operationKey] = {
      type: "withdrawal",
      amount,
      methodName,
      accountHash: walletOperationKey(accountInfo),
      status: "completed",
      createdAt: serverTimestamp
    };
    return current;
  });

  const withdrawal = {
    userId: req.uid,
    userName: profile.displayName || "",
    userEmail: profile.email || "",
    amount,
    methodDetails: { methodName, accountInfo },
    status: "pending",
    requestTimestamp: serverTimestamp
  };
  await Promise.all([
    db.ref(`withdrawals/${requestId}`).set(withdrawal),
    writeTransaction(req.uid, requestId, {
      type: "withdraw_request",
      amount: -amount,
      description: `Withdrawal to ${methodName}`,
      timestamp: serverTimestamp,
      status: "completed",
      withdrawalId: requestId
    })
  ]);
  return res.status(201).json({ success: true, withdrawalId: requestId });
}));

app.post("/api/tournaments/join", requireFirebaseUser, asyncRoute(async (req, res) => {
  const requestId = readRequestId(req.body?.requestId);
  const tournamentId = readProfileText(req.body?.tournamentId, "tournamentId", 128);
  const username = readProfileText(req.body?.username, "username", 80);
  const gameUid = readProfileText(req.body?.gameUid, "gameUid", 80);
  const teammates = Array.isArray(req.body?.teammates) ? req.body.teammates : [];
  const selectedSlots = Array.isArray(req.body?.slots) ? req.body.slots.map(String) : [];
  if (teammates.length > 20 || selectedSlots.length > 20) {
    throw httpError(400, "Team or slot selection is invalid.", "INVALID_INPUT");
  }
  const tournamentRef = db.ref(`tournaments/${tournamentId}`);
  const tournamentSnapshot = await tournamentRef.get();
  if (!tournamentSnapshot.exists()) throw httpError(404, "Tournament not found.", "TOURNAMENT_NOT_FOUND");
  const tournament = tournamentSnapshot.val();
  if (tournament.status !== "upcoming") throw httpError(409, "Tournament is closed.", "TOURNAMENT_CLOSED");
  const slotConfig = tournament.slotConfig || {};
  const needsSlots = Boolean(slotConfig.type && slotConfig.type !== "disabled");
  const teamSize = needsSlots && slotConfig.type === "team" && Number(slotConfig.slotsPerEntry) > 1
    ? Number(slotConfig.slotsPerEntry)
    : 1;
  if (teammates.length !== teamSize - 1) {
    throw httpError(400, "Team details do not match the tournament configuration.", "INVALID_TEAM");
  }
  for (const teammate of teammates) {
    if (!teammate || typeof teammate.username !== "string" || typeof teammate.gameUid !== "string" ||
        teammate.username.trim().length === 0 || teammate.gameUid.trim().length === 0) {
      throw httpError(400, "All teammate details are required.", "INVALID_TEAM");
    }
  }
  const fee = Number(tournament.entryFee || 0);
  if (!Number.isFinite(fee) || fee < 0 || !Number.isSafeInteger(fee * teamSize)) {
    throw httpError(400, "Tournament entry fee is invalid.", "INVALID_TOURNAMENT_FEE");
  }
  const totalFee = fee * teamSize;
  const payloadHash = walletOperationKey(JSON.stringify({ username, gameUid, teammates, selectedSlots }));
  if (needsSlots && (selectedSlots.length !== teamSize ||
      new Set(selectedSlots).size !== selectedSlots.length ||
      selectedSlots.some((slot) => !/^\d+$/.test(slot)))) {
    throw httpError(400, "Select the required number of valid tournament slots.", "INVALID_SLOTS");
  }
  if (!needsSlots && selectedSlots.length > 0) {
    throw httpError(400, "This tournament does not use slots.", "INVALID_SLOTS");
  }

  const operationKey = walletOperationKey(requestId);
  let profile = await updateWallet(req.uid, (current) => {
    if (!current) return;
    current.walletOperations = current.walletOperations || {};
    const prior = current.walletOperations[operationKey];
    if (prior) {
      if (prior.type !== "tournament_join" || prior.tournamentId !== tournamentId) {
        throw httpError(409, "Request ID was already used for another wallet operation.", "IDEMPOTENCY_CONFLICT");
      }
      if (Number(prior.amount) !== totalFee || prior.payloadHash !== payloadHash) {
        throw httpError(409, "Request ID was already used with different tournament details.", "IDEMPOTENCY_CONFLICT");
      }
      if (prior.status === "refunded") {
        throw httpError(409, "This join attempt was already refunded. Start a new join request.", "JOIN_ALREADY_REFUNDED");
      }
      return current;
    }
    if (current.joinedTournaments?.[tournamentId]) {
      throw httpError(409, "You have already joined this tournament.", "ALREADY_JOINED");
    }
    if (Number(current.balance || 0) < totalFee) {
      throw httpError(409, "Insufficient balance.", "INSUFFICIENT_BALANCE");
    }
    current.balance = Number(current.balance || 0) - totalFee;
    current.joinedTournaments = current.joinedTournaments || {};
    current.joinedTournaments[tournamentId] = true;
    current.username = username;
    current.gameUid = gameUid;
    current.walletOperations[operationKey] = {
      type: "tournament_join",
      tournamentId,
      amount: totalFee,
      payloadHash,
      status: "charged",
      createdAt: serverTimestamp
    };
    return current;
  });

  let tournamentReserved = false;
  try {
    const registration = {
      joinedAt: serverTimestamp,
      username,
      gameUid,
      teammates: teammates.map((teammate) => ({
        username: teammate.username.trim().slice(0, 80),
        gameUid: teammate.gameUid.trim().slice(0, 80)
      }))
    };
    if (needsSlots) registration.slots = selectedSlots;
    const reservation = await tournamentRef.transaction((current) => {
      if (!current) return;
      if (current.registeredPlayers?.[req.uid]) return current;
      if (current.status !== "upcoming") return;
      const currentSlotConfig = current.slotConfig || {};
      const currentNeedsSlots = Boolean(currentSlotConfig.type && currentSlotConfig.type !== "disabled");
      const currentTeamSize = currentNeedsSlots && currentSlotConfig.type === "team" &&
        Number(currentSlotConfig.slotsPerEntry) > 1
        ? Number(currentSlotConfig.slotsPerEntry)
        : 1;
      if (Number(current.entryFee || 0) !== fee ||
          currentNeedsSlots !== needsSlots ||
          currentTeamSize !== teamSize) return;
      const registeredPlayers = current.registeredPlayers || {};
      const maxPlayers = Number(current.maxPlayers || 0);
      if (maxPlayers > 0 && Object.keys(registeredPlayers).length >= maxPlayers) return;
      if (needsSlots) {
        const slots = current.slots || {};
        const maxSlotNumber = Number(current.maxPlayers || 0);
        if (selectedSlots.some((slot) =>
          Number(slot) < 1 ||
          (maxSlotNumber > 0 && Number(slot) > maxSlotNumber) ||
          slots[slot]
        )) return;
        for (const slot of selectedSlots) slots[slot] = req.uid;
        current.slots = slots;
      }
      current.registeredPlayers = registeredPlayers;
      current.registeredPlayers[req.uid] = registration;
      return current;
    }, undefined, false);
    if (!reservation.committed || !reservation.snapshot.child(`registeredPlayers/${req.uid}`).exists()) {
      throw httpError(409, "Tournament is full or selected slots are no longer available.", "TOURNAMENT_UNAVAILABLE");
    }
    tournamentReserved = true;

    profile = await updateWallet(req.uid, (current) => {
      if (!current?.walletOperations?.[operationKey]) return;
      current.walletOperations[operationKey].status = "completed";
      return current;
    });
  } catch (error) {
    if (!tournamentReserved) {
      await updateWallet(req.uid, (current) => {
        if (!current?.walletOperations?.[operationKey]) return;
        const operation = current.walletOperations[operationKey];
        if (operation.status === "charged") {
          current.balance = Number(current.balance || 0) + Number(operation.amount || 0);
          if (current.joinedTournaments) delete current.joinedTournaments[tournamentId];
          operation.status = "refunded";
          operation.refundedAt = serverTimestamp;
        }
        return current;
      });
    }
    throw error;
  }

  await writeTransaction(req.uid, requestId, {
    type: "tournament_join",
    amount: -totalFee,
    description: `Joined: ${tournament.name || "Tournament"}`,
    timestamp: serverTimestamp,
    status: "completed",
    tournamentId,
    balanceAfter: Number(profile.balance || 0)
  });
  return res.status(201).json({ success: true, tournamentId, balance: Number(profile.balance || 0) });
}));

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number(error.status) || 500;
  if (status >= 500) console.error("API request failed:", error);
  res.status(status).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: status >= 500 && !error.code ? "An unexpected server error occurred." : error.message
    }
  });
});

if (require.main === module) {
  if (!process.env.OPERATION_HASH_SECRET || Buffer.byteLength(process.env.OPERATION_HASH_SECRET) < 32) {
    throw new Error("OPERATION_HASH_SECRET must contain at least 32 bytes.");
  }
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`FFApp API listening on port ${port}`));
}

module.exports = app;
