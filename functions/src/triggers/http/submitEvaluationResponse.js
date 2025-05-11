const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

exports.submitEvaluationResponse = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { studentId, formId, answers, profLoadId } = req.body;
    if (!studentId || !formId || !answers) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();
      await db.query("BEGIN");

      const evalResponseId = uuidv4();

      await db.query(`
        INSERT INTO "Form_Responses"
        ("eval_response_id", "eval_form_id", "student_id", "date_submitted")
        VALUES ($1, $2, $3, NOW())
      `, [evalResponseId, formId, studentId]);

      await db.query(`
        INSERT INTO "Student_Prof_Track"
        ("sp_track_id", "eval_response_id", "student_id", "prof_load_id", "status", "date_submitted")
        VALUES ($1, $2, $3, $4, 'Submitted', NOW())
      `, [uuidv4(), evalResponseId, studentId, profLoadId]);

      for (const [questionId, answer] of Object.entries(answers)) {
        await db.query(`
          INSERT INTO "Question_Responses_Fact"
          ("eval_response_id", "form_question_id", "answer_text")
          VALUES ($1, $2, $3)
        `, [evalResponseId, questionId, answer]);
      }

      await db.query("COMMIT");
      await db.end();

      return res.status(200).json({ success: true });

    } catch (err) {
      await db.query("ROLLBACK");
      await db.end();
      console.error("Error in submitEvaluationResponse:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });
});
