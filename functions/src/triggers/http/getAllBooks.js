const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getAllBooks = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    try {
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // Fetch all books
      const result = await db.query(`SELECT * FROM "Books"`);

      await db.end();

      return res.status(200).json({ books: result.rows });

    } catch (err) {
      console.error("Error fetching books:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});