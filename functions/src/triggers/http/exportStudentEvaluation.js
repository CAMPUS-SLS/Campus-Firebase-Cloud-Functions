const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.exportStudentEvaluation = functions.https.onRequest((req, res) => {
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

      // Query excluding department_id
      const result = await db.query(`
        SELECT 
          student_eval_id,
          student_number,
          professor_id,
          course_id,
          technical_mastery,
          ability_to_give_example,
          communicates_well,
          average_score
        FROM "Student_Evaluation"
      `);

      await db.end();
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error in exportStudentEvaluation:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
