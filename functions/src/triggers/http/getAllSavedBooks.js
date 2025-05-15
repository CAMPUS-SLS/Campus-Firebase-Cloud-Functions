const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getAllSavedBooks = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
      try {
          const db = new Client({
              connectionString: process.env.DATABASE_URL,
              ssl: { rejectUnauthorized: false }
            });
          await db.connect();

          if (req.method !== "POST") {
              return res.status(405).json({ message: "Method Not Allowed" });
          }

          const { UID } = req.body;
          console.log("req.body: ", req.body);

          if (!UID) {
              return res.status(400).json({ message: "UID is required" });
          }

          const result = await db.query(
              `SELECT * FROM "Books" WHERE book_id IN (SELECT book_id FROM "Saved_Books" WHERE user_id = $1)`,
              [UID]
          );

          await db.end();

          return res.status(200).json({ savedBooks: result.rows });

      } catch (err) {
          console.error("Error fetching saved books:", err);
          return res.status(500).json({ message: "Server error: " + err.message });
      }
  });
});