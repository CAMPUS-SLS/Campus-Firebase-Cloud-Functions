// functions/src/triggers/http/loginStudent.js

const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.loginStudent = functions.https.onRequest((req, res) => {
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

      // 2. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 3. Confirm user exists in NeonDB with role 'Student'
      const userQuery = await db.query(`
        SELECT u.user_id, u.email, r.role
        FROM "User" u
        JOIN "Role" r ON u.role_id = r.role_id
        WHERE u.user_id = $1 AND u.email = $2 AND r.role = 'Student'
      `, [uid, email]);

      if (userQuery.rowCount === 0) {
        await db.end();
        return res.status(403).json({ message: "Unauthorized. No matching student record." });
      }

      // 4. Fetch user profile
      const profileRes = await db.query(`
        SELECT first_name, last_name, gender
        FROM "User_Profile"
        WHERE user_id = $1
      `, [uid]);

      const profile = profileRes.rows[0] || {};

      await db.end();

      // 5. Return structured data with profile object
      return res.status(200).json({
        message: "Login verified successfully.",
        user_id: uid,
        email,
        role: "Student",
        profile: {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          gender: profile.gender || ""
        }
      });

    } catch (err) {
      console.error("Error in loginStudent:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
