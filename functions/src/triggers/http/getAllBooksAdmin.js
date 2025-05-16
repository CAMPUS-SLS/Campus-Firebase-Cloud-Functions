const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getAllBooksAdmin = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Validate environment variable
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "Database URL is missing in environment variables." });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await db.connect();

      const result = await db.query(`
        SELECT 
          "Books".*, 
          "Course"."course_title", 
          COUNT("Saved_Books"."book_id") AS save_count
        FROM "Books"
        JOIN "Course" ON "Books"."course_id" = "Course"."course_id"
        LEFT JOIN "Saved_Books" ON "Books"."book_id" = "Saved_Books"."book_id"
        GROUP BY "Books"."book_id", "Course"."course_title";
      `);

      return res.status(200).json({ books: result.rows });
    } catch (err) {
      console.error("Error fetching books:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    } finally {
      await db.end(); // Ensuring cleanup always happens
    }
  });
});