# Wallet API and Nepal top-ups

The browser app currently stores its wallet in Firebase Realtime Database at
`users/{uid}`. This API keeps that schema, uses the authenticated Firebase UID,
and is the only client-facing route for balance changes, tournament joins,
withdrawals, and new-account bonuses. The API uses the Firebase Admin SDK;
never ship its service-account credentials to the browser.

For local development, configure Google Application Default Credentials or set
`GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file outside this
repository. Set `FIREBASE_PROJECT_ID` to the same project used by the frontend
(`free-fire-tournment-app-a2de9`). Without Firebase Admin credentials, private
API requests cannot verify revocation or access Firebase data.

## Browser assets and image uploads

The HTML pages contain only the page markup and references to local CSS and
JavaScript assets under `assets/`. Hosting sets a Content Security Policy and
security headers; browser scripts are no longer inline. The Firebase Web API
key in the JavaScript is public Firebase client configuration, not a server
secret. Restrict that key to the app's deployed HTTP referrers and the Firebase
APIs the app uses in Google Cloud Console. Keep Admin SDK credentials and
payment-provider credentials server-side.

Profile photos are uploaded by the signed-in user to
`POST /api/uploads/avatar`. Admin and active staff image uploads use
`POST /api/admin/uploads/image`; the API checks the Firebase ID token and
admin/staff role before accepting an upload. Both endpoints enforce a 5 MB
limit and validate the image file signature, then store the file in Firebase
Storage and return a download-token URL. Those URLs are intentionally
shareable because profile photos, game covers, and promotions are public app
images. Sensitive support attachments use a separate private path and
authorized download endpoint.

ImgBB keys that were previously embedded in the browser were exposed to every
visitor. Remove/revoke those keys in ImgBB even though the current frontend no
longer uses them; replacing the HTML alone cannot make an already exposed key
private.

## PayBridgeNP embedded checkout

`src/payment-provider.js` uses PayBridgeNP's hosted checkout API. The secret
API key remains server-side. Checkout sessions are created in NPR paisa using
an idempotency key and application order metadata. Payment verification reads
the PayBridgeNP session and payment APIs and checks the session, UID, app order
ID, purpose, exact amount, currency, and successful payment status before the
wallet or game order is updated. Browser return parameters are never trusted.

The API also exposes `POST /api/webhooks/paybridgenp`. Register this HTTPS URL
in the PayBridgeNP dashboard under **Settings → Webhooks** and subscribe to
`payment.succeeded`, `payment.failed`, and `payment.cancelled`. Store the
signing secret displayed by PayBridgeNP as `PAYBRIDGENP_WEBHOOK_SECRET`.
Webhook signatures use the raw request body and a five-minute timestamp
window; successful payment events are independently confirmed against the
PayBridgeNP session/payment API before fulfillment. The existing authenticated
verification routes remain available for the app's status UI.

PayBridgeNP hosted checkout lets the customer choose from the Nepali providers
enabled in your PayBridgeNP project (eSewa, Khalti, Fonepay). It accepts integer
paisa, so this app's whole-NPR amount limits apply. PayBridgeNP's eSewa/Khalti
sandbox can be tested with an `sk_test_` key. **Fonepay does not have a true
sandbox and can move real money even with sandbox credentials.**

For wallet top-ups, the API reads the signed-in user's name and phone number
from `users/{uid}` in Firebase Realtime Database (falling back to Firebase
Authentication profile fields) and sends them as checkout customer details so
PayBridgeNP can prefill its contact form. Game top-ups use the same profile
prefill. The checkout opens as a PayBridgeNP overlay on the NepX Scrim page;
the browser never navigates to a separate checkout page for the normal
embedded flow. A payment provider may still hand off to its own app or page
while completing payment.

Set `PAYMENT_CHECKOUT_HOSTS` to the exact checkout hostname
`checkout.paybridgenp.com` (no wildcard). Set `PAYBRIDGE_EMBED_ORIGINS` to a
comma-separated list of exact frontend origins, without paths or trailing
slashes. Local development permits `http://localhost:5500` and
`http://127.0.0.1:5500`; PayBridgeNP must also allowlist the origin in the
Sandbox project's **Project → Embed domains**. Localhost embedding requires a
sandbox key. For production, use an HTTPS site origin, allowlist it in the
PayBridgeNP project, and configure the same origin in `PAYBRIDGE_EMBED_ORIGINS`.
Live embedding requires an eligible PayBridgeNP plan. The session return URL is
set to the validated frontend origin so closing checkout returns to the app.
The API key must have permission to create checkout sessions and read sessions
and payments.

## Deploy with Firebase Hosting and Cloud Functions

The repository's root `firebase.json` serves the static app from the project
root and rewrites `/api/**` and `/health` to the Express `api` Cloud Function.
This makes the frontend's default empty `APP_API_BASE_URL` work on the same
Firebase Hosting domain. The backend is a Node.js 22, second-generation
Firebase Function in `asia-southeast1`.

1. Install Node.js 22 or newer, the Firebase CLI, and Google Cloud CLI. Sign
   into both CLIs and select the Firebase project:

   ```powershell
   npm install --global firebase-tools
   gcloud auth login
   firebase login
   Set-Location C:\Users\pokhr\Documents\ffapp-main
   firebase use free-fire-tournment-app-a2de9
   ```

   `.firebaserc` already selects the project from the Firebase web config.
2. Cloud Functions require the Firebase project to be on the Blaze billing
   plan. In Firebase Console, upgrade the project if prompted and confirm
   Realtime Database, Authentication, and Storage are enabled.
3. Create the runtime identity used by the function and grant it access to
   Firebase Auth, Realtime Database, and the app's Storage bucket:

   ```powershell
   gcloud config set project free-fire-tournment-app-a2de9
   gcloud services enable cloudfunctions.googleapis.com run.googleapis.com eventarc.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
   gcloud iam service-accounts create ffapp-api --display-name "FFApp Firebase API"
   gcloud projects add-iam-policy-binding free-fire-tournment-app-a2de9 `
     --member="serviceAccount:ffapp-api@free-fire-tournment-app-a2de9.iam.gserviceaccount.com" `
     --role="roles/firebasedatabase.admin"
   gcloud projects add-iam-policy-binding free-fire-tournment-app-a2de9 `
     --member="serviceAccount:ffapp-api@free-fire-tournment-app-a2de9.iam.gserviceaccount.com" `
     --role="roles/firebaseauth.admin"
   gcloud storage buckets add-iam-policy-binding gs://free-fire-tournment-app-a2de9.firebasestorage.app `
     --member="serviceAccount:ffapp-api@free-fire-tournment-app-a2de9.iam.gserviceaccount.com" `
     --role="roles/storage.objectAdmin"
   ```

   If a Google Cloud command reports that a role is unavailable or access is
   denied, ask the project owner to grant the equivalent Firebase Auth,
   Realtime Database, and bucket permissions. Never download a service-account
   key into the web app. Your deploying Google account must also be allowed
   to act as the `ffapp-api` service account (`roles/iam.serviceAccountUser`).
4. Set all runtime credentials as Firebase Functions secrets. Do not paste
   secret values into source code, frontend code, or chat. Firebase CLI prompts
   securely for each value:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   firebase functions:secrets:set OPERATION_HASH_SECRET
   firebase functions:secrets:set PAYBRIDGENP_API_KEY
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   firebase functions:secrets:set PAYBRIDGENP_WEBHOOK_SECRET
   ```

   For `PAYBRIDGENP_API_KEY`, enter the newly rotated secret key from the
   PayBridgeNP dashboard. The key previously pasted into chat must remain
   revoked. The random webhook secret is a temporary value so the function can
   be deployed before webhook registration; replace it with the actual
   PayBridgeNP webhook signing secret after step 6.

   Keep this secret unchanged; rotating it without migrating stored wallet
   idempotency keys can make a previously processed request look new.
   Allow the function runtime identity to read the secret:

   ```powershell
   foreach ($secret in @("OPERATION_HASH_SECRET", "PAYBRIDGENP_API_KEY", "PAYBRIDGENP_WEBHOOK_SECRET")) {
     gcloud secrets add-iam-policy-binding $secret `
       --member="serviceAccount:ffapp-api@free-fire-tournment-app-a2de9.iam.gserviceaccount.com" `
       --role="roles/secretmanager.secretAccessor"
   }
   ```
5. Install backend dependencies and deploy the function and hosting site:

   ```powershell
   Set-Location C:\Users\pokhr\Documents\ffapp-main\backend
   npm install
   Set-Location C:\Users\pokhr\Documents\ffapp-main
   firebase deploy --only functions,hosting
   ```

   The deployment command can take several minutes. It should print the
   Hosting URL `https://free-fire-tournment-app-a2de9.web.app` (and the
   `firebaseapp.com` alias) and the `api` function in `asia-southeast1`.
   No `window.APP_API_BASE_URL` setting is needed when using these rewrites.
6. Register the PayBridgeNP webhook in its dashboard at **Settings → Webhooks**:

   ```text
   https://free-fire-tournment-app-a2de9.web.app/api/webhooks/paybridgenp
   ```

   Subscribe to `payment.succeeded`, `payment.failed`, and
   `payment.cancelled`. Copy the webhook signing secret shown once, then set
   the actual value and redeploy the function:

   ```powershell
   firebase functions:secrets:set PAYBRIDGENP_WEBHOOK_SECRET
   firebase deploy --only functions
   ```

   Do not use the temporary random secret for live webhook signing.
7. Check the deployed backend through Hosting:

   ```powershell
   Invoke-RestMethod https://free-fire-tournment-app-a2de9.web.app/health
   ```

   It should return `status: ok`. A request without a Firebase ID token to
   `/api/reports` should get `401`, not `405`. Then open the hosted app,
   sign in, and submit a test ticket. If using a custom domain, it must be
   connected to Firebase Hosting before testing that domain.
8. Deploy the database security rules separately:

   ```powershell
   firebase deploy --only database,firestore
   ```

   `database.rules.json` protects the app's Realtime Database data. The
   matching `firebase rules.txt` is provided for manually pasting the same
   rules in the Firebase Console. Active staff may manage games and
   promotions, update the theme and global notifications, and edit tournament
   details only while leaving player registrations unchanged. Staff cannot
   change wallet balances or write transaction records.

   The rules do not grant every signed-in user access to the complete `users`
   tree: each user can read only their own profile. The previous broad-read
   rule would expose other users' private profile fields and wallet balances.
   User profile writes continue to exclude protected wallet, identity, and
   earnings fields.

   The app currently does not use Firestore; `firestore.rules` therefore denies all
   writes and permits only a signed-in user's reads of their own `/users/{uid}`
   document and its transactions. Do not move wallet data to Firestore unless
   the client and API are deliberately migrated together.

   The Realtime Database rules require an administrator UID to already be
   configured at `adminConfig/adminUid`. Before using these rules on a new
   project, create/sign in with the intended admin account, copy its Firebase
   Auth UID, and set `adminConfig` in the Realtime Database console to include
   `adminUid` (that UID) and `setupComplete: true`. This prevents an arbitrary
   first user from claiming administrator access.

   Rules deployment does not itself charge for reads or writes; usage is
   subject to each Firebase product's plan and quotas. Storage is separate.
   If your project requires a billing-plan upgrade to use its Storage bucket,
   you can skip `firebase deploy --only storage`, but image uploads and report
   attachments that depend on Storage will not work unless the bucket is
   available. `storage.rules` denies direct client access; the API accesses
   Storage through the Admin SDK.
8. Users can read their own profile. Leaderboard and referral lookups now go
   through authenticated, sanitized API responses. New profiles and configured
   signup bonuses are initialized server-side. `settings/signupBonus` is the
   server-read bonus amount; `SIGNUP_BONUS_NPR` is the fallback if the setting
   is absent. Support tickets are submitted through the authenticated API,
   stored under `supportReports/{uid}`, and readable by their owner. The admin
   panel lists and updates tickets; attachment downloads are streamed only
   after designated-admin authorization.
   The admin panel's Game Top-ups section manages packages for games already
   listed in `/games`. Prices are whole NPR values. After checkout is
   independently verified by the configured Nepal payment adapter, the order
   is recorded under `gameTopupOrders/{uid}` for manual game-currency
   fulfillment. The app wallet is not charged or credited by a game top-up.

Do not deploy these rules before the API is running: client-side signup
initialization, tournament fee deductions, and withdrawal writes have been
moved to the API and will otherwise be rejected. Tournament payouts and
admin balance adjustments remain admin-only.

## Smoke checks

* `GET /health` should return `{"status":"ok"}`.
* Without a payment adapter, an authenticated
  `POST /api/create-topup` must return `503` and must not create a pending
  top-up or change a wallet.
* `POST /api/game-topups` must also return `503` until the Nepal gateway
  adapter and checkout host allowlist are configured. After activation, test
  that the server uses the admin-configured NPR package price, only records
  an order after matching provider verification, and prevents reuse of a
  provider transaction ID.
* With a real adapter, test each enabled method using a provider sandbox.
  Confirm a pending provider response does not change the balance; a paid
  response with the wrong NPR amount, currency, session, or reused provider
  transaction ID is rejected; and repeating verification credits only once.
* Test invalid/expired Firebase ID tokens, attempts to write
  `users/{uid}/balance` and `transactions/{uid}`, and tournament joins with
  insufficient balance or occupied slots. All direct client writes to
  protected records should fail.

The client opens gateway checkout in a separate tab (never an iframe), polls
the authenticated verification route, and listens to
`walletTopups/{uid}/{sessionId}` and the user's profile for server updates.
