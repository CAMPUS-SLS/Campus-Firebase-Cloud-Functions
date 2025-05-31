const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.getAllProspectsWithPredictions = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // Join all relevant tables
      const result = await db.query(
        `SELECT 
            u.id AS user_id,
            u.first_name,
            u.family_name,
            g.grade9_english, g.grade9_math, g.grade9_science, g.grade9_general,
            g.grade10_english, g.grade10_math, g.grade10_science, g.grade10_general,
            g.grade11_english, g.grade11_math, g.grade11_science, g.grade11_general,
            p.household_income,
            pr.conversion_result,
            pr.conversion_probability,
            pr.fit_score,
            pr.lead_score
         FROM "Grades_Form" g
         LEFT JOIN "Parent_Info" p ON g.user_id = p.user_id
         LEFT JOIN "personal_information" u ON g.user_id = u.id
         LEFT JOIN "Prediction_Results" pr ON g.user_id = pr.user_id
         ORDER BY pr.lead_score DESC, u.family_name, u.first_name`
      );
      await db.end();

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error in getAllProspectsWithPredictions:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});