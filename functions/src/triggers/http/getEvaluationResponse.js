const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getEvaluationResponse = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { evalResponseId } = req.query;

    if (!evalResponseId) {
      return res.status(400).json({ message: "Missing evalResponseId" });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      // 🧠 Query all responses related to this evalResponseId
      const responseRes = await db.query(
        `SELECT form_question_id, answer_text, row_label, col_label
         FROM "Question_Responses_Fact"
         WHERE eval_response_id = $1`,
        [evalResponseId]
      );

      const answers = {};

      for (const row of responseRes.rows) {
        const { form_question_id, answer_text, row_label, col_label } = row;

        // Initialize the answer structure if it doesn't exist
        if (!answers[form_question_id]) {
          answers[form_question_id] = {
            type: row_label && col_label ? 'gridCheckbox' : 
                  row_label ? 'gridChoice' : 
                  col_label ? 'ranking' : 'normal',
            value: row_label && col_label ? {} : 
                   row_label ? {} : 
                   col_label ? [] : null
          };
        }

        // Handle different response types
        if (row_label && col_label) {
          // gridCheckbox
          if (!answers[form_question_id].value[row_label]) {
            answers[form_question_id].value[row_label] = {};
          }
          answers[form_question_id].value[row_label][col_label] = true;
        } else if (row_label) {
          // gridChoice
          answers[form_question_id].value[row_label] = answer_text;
        } else if (col_label) {
          // ranking
          answers[form_question_id].value.push({ option: answer_text, rank: parseInt(col_label) });
        } else {
          // normal or checkbox
          if (answers[form_question_id].value === null) {
            answers[form_question_id].value = answer_text;
          } else if (Array.isArray(answers[form_question_id].value)) {
            answers[form_question_id].value.push(answer_text);
          } else {
            answers[form_question_id].value = [answers[form_question_id].value, answer_text];
          }
        }
      }

      await db.end();
      return res.status(200).json({ answers });
    } catch (err) {
      console.error("❌ getEvaluationResponse error:", err);
      await db.end();
      return res.status(500).json({ message: err.message });
    }
  });
});
