const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.addSavedBooks = functions.https.onRequest((req, res) => {
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

        const { UID, BookID } = req.body;
        console.log("req.body: ", req.body)

        if (!UID || !BookID) {
            return res.status(400).json({ message: "UID and BookID are required" });
        }

        // Generate the current date and time
        const timeOfSaving = new Date();

        const insertResult = await db.query(
            `INSERT INTO "Saved_Books" (user_id, book_id, time_of_saving) VALUES ($1, $2, $3) RETURNING *`,
            [UID, BookID, timeOfSaving]
        );

        await db.end();

        return res.status(200).json({ message: "Book added successfully", book: insertResult.rows[0] });

        } catch (err) {
        console.error("Error adding book:", err);
        return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});