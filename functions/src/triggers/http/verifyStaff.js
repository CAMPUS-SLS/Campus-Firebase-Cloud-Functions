// functions/src/triggers/http/verifyStaff.js

const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.verifyStaff = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      const { user_id } = req.body;
      if (!user_id) return res.status(400).json({ message: "Missing user_id" });

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // Verify account
      await db.query(`
        UPDATE "User"
        SET is_verified_admin_prof = TRUE
        WHERE user_id = $1
      `, [user_id]);

      await db.end();

      return res.status(200).json({ message: "Staff account verified successfully." });

    } catch (err) {
      console.error("Error in verifyStaff:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
