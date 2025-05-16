const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

exports.exportStudentEvaluation = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      const result = await db.query(`
        SELECT 
          student_eval_id,
          student_id,
          professor_id,
          course_id,
          technical_mastery,
          ability_to_give_example,
          communicates_well,
          average_score
        FROM "Student_Evaluation"
      `);

      await db.end();

      return res.status(200).json({
        success: true,
        data: result.rows
      });

    } catch (err) {
      console.error("❌ Error in exportStudentEvaluations:", err);
      await db.end();
      return res.status(500).json({ success: false, message: "Server error: " + err.message });
    }
  });
});
