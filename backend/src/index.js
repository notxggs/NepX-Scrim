const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const app = require("./server");

const operationHashSecret = defineSecret("OPERATION_HASH_SECRET");
const payBridgeApiKey = defineSecret("PAYBRIDGENP_API_KEY");
const payBridgeWebhookSecret = defineSecret("PAYBRIDGENP_WEBHOOK_SECRET");

exports.api = onRequest({
  region: "asia-southeast1",
  timeoutSeconds: 60,
  memory: "512MiB",
  serviceAccount: "ffapp-api@free-fire-tournment-app-a2de9.iam.gserviceaccount.com",
  secrets: [operationHashSecret, payBridgeApiKey, payBridgeWebhookSecret]
}, app);
