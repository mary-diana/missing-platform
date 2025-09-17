const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Helper function to create notifications for users in same county
 */
async function createNotificationsForCounty(report, reportType, context) {
  const county = report.county;
  if (!county) return;

  // get all users in the same county
  const usersSnap = await db.collection("users").where("county", "==", county).get();

  const batch = db.batch();

  usersSnap.forEach((userDoc) => {
    const notificationRef = db.collection("notifications").doc();

    batch.set(notificationRef, {
      notification_id: notificationRef.id,
      user_id: userDoc.id,
      reportId: context.params.reportId,
      title: reportType === "danger" ? "New Danger Alert" : "Missing Person Alert",
      message: reportType === "danger"
        ? `A danger has been reported in ${county}. Stay alert!`
        : `A missing person has been reported in ${county}. Please help if you can.`,
      read: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

/**
 * Trigger when new danger report is added
 */
exports.onNewDangerReport = functions.firestore
  .document("dangerReports/{reportId}")
  .onCreate(async (snap, context) => {
    const report = snap.data();
    await createNotificationsForCounty(report, "danger", context);
  });

/**
 * Trigger when new missing person report is added
 */
exports.onNewMissingPersonReport = functions.firestore
  .document("missingPersonsReports/{reportId}")
  .onCreate(async (snap, context) => {
    const report = snap.data();
    await createNotificationsForCounty(report, "missing", context);
  });