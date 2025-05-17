const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { admin } = require("../../config/firebase");
require("dotenv").config();

exports.getAllProfileData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      // Verify Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Use provided user_id or fallback to uid from token
      const { user_id } = req.body;
      const finalUserId = user_id || uid;

      if (!finalUserId) {
        return res.status(400).json({ message: "Missing user_id parameter" });
      }

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await db.connect();

      // Fetch only personal info fields
      const query = `
        SELECT 
          user_id,
          first_name,
          middle_name,
          last_name,
          auxillary_name,
          birth_date,
          gender,
          nationality,
          religion,
          contact_no,
          working_status,
          acr_no,
          income_status,
          legal_status,
          employer,
          address_id
        FROM "User_Profile"
        WHERE user_id = $1
      `;

      const result = await db.query(query, [finalUserId]);
      await db.end();

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      return res.status(200).json({ student: result.rows[0] });
    } catch (err) {
      console.error("Error in getAllProfileData:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
