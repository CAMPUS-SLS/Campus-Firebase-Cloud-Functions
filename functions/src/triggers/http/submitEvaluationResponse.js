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

    const { userId, evalFormId, profLoadId, answers } = req.body;

    if (!userId || !evalFormId || !profLoadId || !answers) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();
      await db.query("BEGIN");

      // 🔍 Resolve student_id from user_id
      const studentRes = await db.query(
        `SELECT student_id FROM "Student" WHERE user_id = $1`,
        [userId]
      );

      if (studentRes.rowCount === 0) {
        throw new Error(`No student found for user_id: ${userId}`);
      }

      const studentId = studentRes.rows[0].student_id;

      // 🔍 Check if student-professor-course has pending record
      const trackRes = await db.query(
        `SELECT sp_track_id FROM "Student_Prof_Track"
         WHERE student_id = $1 AND prof_load_id = $2 AND status = 'Pending'`,
        [studentId, profLoadId]
      );

      if (trackRes.rowCount === 0) {
        throw new Error(`No pending evaluation record found for student ${studentId} and prof_load_id ${profLoadId}`);
      }

      const spTrackId = trackRes.rows[0].sp_track_id;
      const evalResponseId = `er_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

      // 📝 Save Form Response
      await db.query(
        `INSERT INTO "Form_Responses"
         (eval_response_id, eval_form_id, student_id, date_submitted)
         VALUES ($1, $2, $3, NOW())`,
        [evalResponseId, evalFormId, studentId]
      );

      // ✅ Update tracking table
      await db.query(
        `UPDATE "Student_Prof_Track"
         SET eval_response_id = $1, status = 'Submitted', date_submitted = NOW()
         WHERE sp_track_id = $2`,
        [evalResponseId, spTrackId]
      );

      // 💬 Save answers
      for (const response of answers) {
        const {
          formQuestionId,
          questionType,
          answerText,
          rowLabel,
          colLabel,
        } = response;

        switch (questionType) {
          case "checkboxes":
            for (const opt of answerText || []) {
              await db.query(
                `INSERT INTO "Question_Responses_Fact"
                 (eval_response_id, form_question_id, answer_text)
                 VALUES ($1, $2, $3)`,
                [evalResponseId, formQuestionId, opt]
              );
            }
            break;
          case "ranking":
            for (const { option, rank } of answerText || []) {
              await db.query(
                `INSERT INTO "Question_Responses_Fact"
                 (eval_response_id, form_question_id, answer_text, col_label)
                 VALUES ($1, $2, $3, $4)`,
                [evalResponseId, formQuestionId, option, rank.toString()]
              );
            }
            break;
          case "gridCheckbox":
            for (const { row, col } of answerText || []) {
              await db.query(
                `INSERT INTO "Question_Responses_Fact"
                 (eval_response_id, form_question_id, row_label, col_label, answer_text)
                 VALUES ($1, $2, $3, $4, 'Checked')`,
                [evalResponseId, formQuestionId, row, col]
              );
            }
            break;
          default:
            await db.query(
              `INSERT INTO "Question_Responses_Fact"
               (eval_response_id, form_question_id, answer_text, row_label, col_label)
               VALUES ($1, $2, $3, $4, $5)`,
              [evalResponseId, formQuestionId, answerText || "", rowLabel || null, colLabel || null]
            );
        }
      }

      await db.query("COMMIT");
      await db.end();
      return res.status(200).json({ success: true, evalResponseId });

    } catch (err) {
      await db.query("ROLLBACK");
      await db.end();
      console.error("❌ submitEvaluationResponse error:", err);
      return res.status(500).json({ message: err.message });
    }
  });
});
