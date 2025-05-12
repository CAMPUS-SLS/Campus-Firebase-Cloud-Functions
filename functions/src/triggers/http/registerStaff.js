const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.registerStaff = functions.https.onRequest((req, res) => {
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

      const { first_name, last_name, gender, role } = req.body;

      if (!['Professor', 'Admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      const roleQuery = await db.query(`SELECT role_id FROM "Role" WHERE role = $1`, [role]);
      if (roleQuery.rowCount === 0) {
        await db.end();
        return res.status(400).json({ message: "Role not found in database." });
      }

      const role_id = roleQuery.rows[0].role_id;

      await db.query(`INSERT INTO "User" (user_id, email, role_id, is_verified_admin_prof) VALUES ($1, $2, $3, $4)`, [
        uid, email, role_id, false
      ]);

      const user_profile_id = `up_${uid.slice(0, 8)}`;

      await db.query(`
        INSERT INTO "User_Profile" (
          user_profile_id, user_id, first_name, last_name, gender
        ) VALUES ($1, $2, $3, $4, $5)
      `, [user_profile_id, uid, first_name, last_name, gender]);

      await db.end();

      return res.status(200).json({ message: "Registration complete. Awaiting admin approval." });

    } catch (err) {
      console.error("Error in registerStaff:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
