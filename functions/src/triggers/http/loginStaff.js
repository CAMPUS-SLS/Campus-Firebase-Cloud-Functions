const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.loginStaff = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const email = decodedToken.email;

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      const userQuery = await db.query(`
        SELECT u.user_id, u.email, r.role, u.is_verified_admin_prof
        FROM "User" u
        JOIN "Role" r ON u.role_id = r.role_id
        WHERE u.user_id = $1 AND u.email = $2
      `, [uid, email]);

      if (userQuery.rowCount === 0) {
        await db.end();
        return res.status(403).json({ message: "User not found." });
      }

      const user = userQuery.rows[0];

      if (!['Professor', 'Admin'].includes(user.role)) {
        await db.end();
        return res.status(403).json({ message: "Unauthorized role." });
      }

      if (user.is_verified_admin_prof !== true && user.is_verified_admin_prof !== 'true') {
        await db.end();
        return res.status(403).json({ message: "Your account is pending admin approval." });
      }      

      const profileQuery = await db.query(`
        SELECT first_name, last_name, gender
        FROM "User_Profile"
        WHERE user_id = $1
      `, [uid]);

      const profile = profileQuery.rows[0] || {};
      await db.end();

      return res.status(200).json({
        message: "Login successful.",
        user_id: uid,
        email: user.email,
        role: user.role,
        profile
      });

    } catch (err) {
      console.error("Error in loginStaff:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
