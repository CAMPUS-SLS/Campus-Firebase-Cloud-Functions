// functions/src/triggers/http/verifyAlumni.js
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
const { Client } = require("pg");

if (!admin.apps.length) admin.initializeApp();

exports.verifyAlumni = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Get the ID token from the Authorization header.
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ error: "Missing auth token" });

    try {
      // Verify the ID token and extract the user's email.
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = decoded.email;

      // Connect to your PostgreSQL database.
      const db = new Client({
        user: "neondb_owner",
        host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
        database: "neondb",
        password: "npg_mQOGqHwl95Cd",
        port: 5432,
        ssl: { rejectUnauthorized: false },
      });
      await db.connect();

      // Query the database for the alumni profile using the email and checking the role.
      const query = `
        SELECT ap.alumni_profile_id
        FROM "User" u
        JOIN "Role" r ON u.role_id = r.role_id
        JOIN "Alumni_Profiles" ap ON ap.user_id = u.user_id
        WHERE u.email = $1 AND r.role_id = 'ROLE04'
      `;
      const { rows } = await db.query(query, [email]);
      await db.end();

      if (!rows.length) {
        return res.status(403).json({ error: "Not an alumni account" });
      }

      // If found, return the alumni profile ID.
      return res.json({
        alumniProfileId: rows[0].alumni_profile_id,
      });
    } catch (err) {
      console.error("🔥 verifyAlumni error:", err.stack || err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});
