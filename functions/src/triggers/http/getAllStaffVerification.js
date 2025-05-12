// functions/src/triggers/http/getAllStaffVerification.js

const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getAllStaffVerification = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await db.connect();

      const result = await db.query(`
        SELECT 
          u.user_id,
          u.email,
          r.role,
          u.is_verified_admin_prof,
          up.first_name,
          up.last_name,
          up.gender
        FROM "User" u
        JOIN "User_Profile" up ON u.user_id = up.user_id
        JOIN "Role" r ON u.role_id = r.role_id
        WHERE r.role IN ('Admin', 'Professor')
        ORDER BY u.created_at DESC NULLS LAST
      `);

      await db.end();

      return res.status(200).json({ staff: result.rows });

    } catch (err) {
      console.error("Error in getAllStaffVerification:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
