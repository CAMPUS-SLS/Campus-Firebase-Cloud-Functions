const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.insertProgramPreferences = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
      // 1. Verify Firebase Auth token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
      }
      const idToken = authHeader.split('Bearer ')[1];
      const { uid } = await admin.auth().verifyIdToken(idToken);

      // 2. Parse request body
      const { priority_program, alternative_program } = req.body;
      if (!priority_program) {
        return res.status(400).json({ message: 'Priority program is required.' });
      }

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      await db.query(
        `INSERT INTO "Applicant_Program_Preferences" (
          user_id, priority_program, alternative_program, updated_at
        ) VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          priority_program = EXCLUDED.priority_program,
          alternative_program = EXCLUDED.alternative_program,
          updated_at = NOW()
        `,
        [uid, priority_program, alternative_program]
      );

      await db.end();

      return res.status(200).json({ message: 'Program preferences saved successfully.' });
    } catch (err) {
      console.error('Error in insertProgramPreferences:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});