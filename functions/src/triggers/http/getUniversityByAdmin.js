const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();


exports.getUniversityByAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId query parameter." });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      const result = await db.query(`
        SELECT u.university_id
        FROM "Admin" a
        JOIN "Department" d ON a.department_id = d.department_id
        JOIN "College" c ON d.college_id = c.college_id
        JOIN "University" u ON c.university_id = u.university_id
        WHERE a.user_id = $1
        LIMIT 1
      `, [userId]);

      await db.end();

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "University not found for this admin." });
      }

      return res.status(200).json({ university_id: result.rows[0].university_id });

    } catch (err) {
      console.error("Error in getUniversityByAdmin:", err);
      await db.end();
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
