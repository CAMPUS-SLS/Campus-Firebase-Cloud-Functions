// functions/src/triggers/http/verifyReferenceNumber.js

const { Client } = require("pg");
const { admin } = require("../../config/firebase");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.verifyReferenceNumber = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      // 1. Verify Firebase token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      // 2. Parse request body
      const { referenceNumber } = req.body;

      // 3. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
      await db.connect();

      // 4. Validate user and referenceNumber match
      const result = await db.query(
        `
        SELECT sa.reference_number
        FROM "Student_Applicant" sa
        JOIN "User" u ON sa.user_id = u.user_id
        WHERE u.email = $1 AND sa.reference_number = $2
        `,
        [email, referenceNumber]
      );

      await db.end();

      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Reference number does not match." });
      }

      return res.status(200).json({ message: "Reference number validated." });

    } catch (err) {
      console.error("Error in verifyReferenceNumber:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
