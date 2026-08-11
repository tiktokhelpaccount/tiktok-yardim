/**
 * Kapalı tarayıcı push (önerilen yol — Legacy Server Key yoksa).
 *
 * Kurulum:
 *   cd functions
 *   npm install
 *   firebase deploy --only functions
 *
 * Client zaten /pushOutbox altına yazar; bu function token’lara FCM gönderir.
 */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPushOutbox = functions.database
  .ref("/pushOutbox/{id}")
  .onCreate(async (snap) => {
    const data = snap.val() || {};
    const tokens = Array.isArray(data.tokens)
      ? data.tokens.map((t) => String(t || "").trim()).filter(Boolean)
      : [];
    if (!tokens.length) {
      await snap.ref.remove().catch(() => {});
      return null;
    }

    const title = data.notification?.title || data.data?.title || "Bildirim";
    const body = data.notification?.body || data.data?.body || "";
    const payload = {
      notification: { title: String(title).slice(0, 120), body: String(body).slice(0, 240) },
      data: Object.fromEntries(
        Object.entries(data.data || {}).map(([k, v]) => [k, String(v ?? "")])
      ),
      tokens,
    };

    try {
      await admin.messaging().sendEachForMulticast(payload);
    } catch (err) {
      console.error("sendPushOutbox", err);
    }
    await snap.ref.remove().catch(() => {});
    return null;
  });
