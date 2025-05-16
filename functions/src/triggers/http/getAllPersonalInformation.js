const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { admin } = require("../../config/firebase");
require("dotenv").config();

exports.getAllPersonalInformation = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await db.connect();

      // Assuming 'user_id' is the foreign key in 'personal_information'
      const result = await db.query(
        `SELECT * FROM "personal_information" WHERE id = $1`,
        [uid]
      );

      await db.end();

      return res.status(200).json({ data: result.rows });
    } catch (err) {
      console.error("Error in getAllPersonalInformation:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});