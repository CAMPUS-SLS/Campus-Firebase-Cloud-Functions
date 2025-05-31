const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.storePredictionResults = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
      const { predictions } = req.body; // Array of prediction objects

      if (!Array.isArray(predictions) || predictions.length === 0) {
        return res.status(400).json({ message: 'No predictions provided.' });
      }

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();
      await db.query('BEGIN');

      for (const pred of predictions) {
        // Destructure and sanitize
        const {
          user_id,
          first_name,
          last_name,
          conversion_result,
          conversion_probability,
          fit_score,
          lead_score
        } = pred;

        await db.query(
          `INSERT INTO "Prediction_Results" (
            user_id, first_name, last_name,
            conversion_result, conversion_probability, fit_score, lead_score, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            conversion_result = EXCLUDED.conversion_result,
            conversion_probability = EXCLUDED.conversion_probability,
            fit_score = EXCLUDED.fit_score,
            lead_score = EXCLUDED.lead_score,
            updated_at = NOW()
          `,
          [
            user_id,
            first_name,
            last_name,
            conversion_result,
            conversion_probability,
            fit_score,
            lead_score
          ]
        );
      }

      await db.query('COMMIT');
      await db.end();

      return res.status(200).json({ message: 'Prediction results stored successfully.' });
    } catch (err) {
      console.error('Error in storePredictionResults:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});