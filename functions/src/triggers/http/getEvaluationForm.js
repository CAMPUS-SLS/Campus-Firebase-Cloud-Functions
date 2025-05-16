const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getEvaluationForm = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { universityId } = req.query;
    
    if (!universityId) {
      return res.status(400).json({ message: "Missing required parameter: universityId" });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      // 🔍 Fetch the most recently published form for the specific university
      const formRes = await db.query(
        `SELECT * FROM "Evaluation_Forms"
         WHERE date_published IS NOT NULL
         AND university_id = $1
         ORDER BY date_published DESC
         LIMIT 1`,
        [universityId]
      );

      const form = formRes.rows[0];
      if (!form) {
        await db.end();
        return res.status(404).json({ message: "No published evaluation form found." });
      }

      const sectionsRes = await db.query(
        `SELECT * FROM "Form_Sections" WHERE "eval_form_id" = $1 ORDER BY "sort_order"`,
        [form.eval_form_id]
      );
      const sections = sectionsRes.rows;

      for (const section of sections) {
        const qRes = await db.query(
          `SELECT * FROM "Form_Questions" WHERE "form_section_id" = $1 ORDER BY "sort_order"`,
          [section.form_section_id]
        );
        const questions = qRes.rows;

        for (const question of questions) {
          const optionsRes = await db.query(
            `SELECT * FROM "Question_Options" WHERE "form_question_id" = $1 ORDER BY "sort_order"`,
            [question.form_question_id]
          );
          const gridRowsRes = await db.query(
            `SELECT * FROM "Question_Grid_Rows" WHERE "form_question_id" = $1 ORDER BY "sort_order"`,
            [question.form_question_id]
          );
          const gridColsRes = await db.query(
            `SELECT * FROM "Question_Grid_Cols" WHERE "form_question_id" = $1 ORDER BY "sort_order"`,
            [question.form_question_id]
          );

          question.options = optionsRes.rows;
          question.gridRows = gridRowsRes.rows.map(r => r.label);
          question.gridColumns = gridColsRes.rows.map(c => c.label);
        }

        section.questions = questions;
      }

      await db.end();
      return res.status(200).json({ ...form, sections });

    } catch (err) {
      console.error("Error in getEvaluationForm:", err);
      await db.end();
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});

