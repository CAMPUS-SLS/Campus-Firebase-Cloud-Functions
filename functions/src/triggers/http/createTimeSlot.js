// functions/src/triggers/http/getAllStaffVerification.js

const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.createTimeSlot = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await db.connect();

      const result = await db.query(`
        SELECT * 
        FROM "Timeslot"
      `);

      await db.end();

      return res.status(200).json({ staff: result.rows });

    } catch (err) {
      console.error("Error in getAllStaffVerification:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});