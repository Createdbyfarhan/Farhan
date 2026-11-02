/* functions/index.js — deploy with: firebase deploy --only functions
   Run `firebase init functions` in the project folder, choose Node 20. */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

/* One-shot admin bootstrap */
exports.bootstrapAdmin = onCall({ enforceAppCheck: false }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Sign in first.");
  const secret = req.data?.secret;
  if (!secret || typeof secret !== "string" || secret.length < 16) {
    throw new HttpsError("invalid-argument", "Secret required.");
  }
  const cfgRef = db.doc("config/bootstrap");
  const cfgSnap = await cfgRef.get();
  if (!cfgSnap.exists) throw new HttpsError("failed-precondition", "Bootstrap config missing.");
  const cfg = cfgSnap.data();
  if (cfg.used) throw new HttpsError("failed-precondition", "Bootstrap already used.");
  if (cfg.value !== secret) throw new HttpsError("permission-denied", "Invalid secret.");

  await db.doc(`users/${req.auth.uid}`).update({
    role: "admin", updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await cfgRef.update({
    used: true, usedBy: req.auth.uid,
    usedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  return { ok: true };
});

/* Audit log on sensitive writes (server-side, tamper-proof) */
exports.auditOrderStatus = onDocumentUpdated("orders/{orderId}", async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.orderStatus === after.orderStatus) return;
  await db.collection("auditLogs").add({
    action: "order.status.server",
    orderId: event.params.orderId,
    from: before.orderStatus, to: after.orderStatus,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
});

/* Revoke sessions after password reset — Firebase Auth handles this,
   but you can force refresh tokens here if you track passwordChangedAt. */