const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

exports.saveEvaluationForm = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const body = req.body;

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();
      await db.query("BEGIN");

      const {
        universityId,
        instructions,
        startDate,
        endDate,
        evaluationPeriod,
        academicYear,
        academicTerm,
        createdBy, // this is the user_id of the admin
      } = body.formMeta;

      // 🔍 Resolve admin_id using user_id
      const adminRes = await db.query(
        `SELECT admin_id FROM "Admin" WHERE user_id = $1`,
        [createdBy]
      );

      const adminId = adminRes.rows[0]?.admin_id;
      if (!adminId) {
        throw new Error(`No matching admin_id found for user_id "${createdBy}"`);
      }

      const evalFormId = `form_${uuidv4().slice(0, 8)}`;
      console.log({ evalResponseId, formId, studentId, profLoadId, answers });
      await db.query(
        `
        INSERT INTO "Evaluation_Forms"
        ("eval_form_id", "university_id", "instructions", "acad_year", "acad_term", "eval_period", "start_date", "end_date", "created_by", "date_created", "date_published")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      `,
        [
          evalFormId,
          universityId,
          instructions,
          academicYear,
          academicTerm,
          evaluationPeriod,
          startDate,
          endDate,
          adminId,
        ]
      );
      

      for (const [sIdx, section] of body.sections.entries()) {
        const sectionId = `sec_${uuidv4().slice(0, 8)}`;

        await db.query(
          `
          INSERT INTO "Form_Sections"
          ("form_section_id", "eval_form_id", "title", "instructions", "weight", "sort_order")
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            sectionId,
            evalFormId,
            section.title,
            section.instructions,
            section.weight,
            sIdx,
          ]
        );

        for (const [qIdx, q] of section.questions.entries()) {
          const questionId = `q_${uuidv4().slice(0, 12)}`;

          await db.query(
            `
            INSERT INTO "Form_Questions"
            ("form_question_id", "form_section_id", "question_text", "question_type", "sort_order")
            VALUES ($1, $2, $3, $4, $5)
          `,
            [questionId, sectionId, q.questionText, q.questionType, qIdx]
          );

          if (
            ["multipleChoice", "checkboxes", "dropdown", "ranking"].includes(
              q.questionType
            )
          ) {
            for (const [optIdx, opt] of q.options.entries()) {
              const optionId = `opt_${uuidv4().slice(0, 12)}`;
              await db.query(
                `
                INSERT INTO "Question_Options"
                ("q_option_id", "form_question_id", "label", "value", "sort_order")
                VALUES ($1, $2, $3, $4, $5)
              `,
                [optionId, questionId, opt, opt, optIdx]
              );
            }
          }

          if (["gridChoice", "gridCheckbox"].includes(q.questionType)) {
            for (const [rowIdx, row] of q.gridRows.entries()) {
              const rowId = `row_${uuidv4().slice(0, 12)}`;
              await db.query(
                `
                INSERT INTO "Question_Grid_Rows"
                ("grid_row_id", "form_question_id", "label", "sort_order")
                VALUES ($1, $2, $3, $4)
              `,
                [rowId, questionId, row, rowIdx]
              );
            }

            for (const [colIdx, col] of q.gridColumns.entries()) {
              const colId = `col_${uuidv4().slice(0, 12)}`;
              await db.query(
                `
                INSERT INTO "Question_Grid_Cols"
                ("grid_col_id", "form_question_id", "label", "sort_order")
                VALUES ($1, $2, $3, $4)
              `,
                [colId, questionId, col, colIdx]
              );
            }
          }
        }
      }

      await db.query("COMMIT");
      await db.end();

      return res.status(200).json({
        success: true,
        evalFormId,
        message: "Evaluation form saved successfully.",
      });
    } catch (err) {
      await db.query("ROLLBACK");
      await db.end();
      console.error("Error in saveEvaluationForm:", err);
      return res.status(500).json({
        success: false,
        message: "Server error: " + err.message,
      });
    }
  });
});
