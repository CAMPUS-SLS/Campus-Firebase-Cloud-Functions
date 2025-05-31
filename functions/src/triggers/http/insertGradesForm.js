const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.insertGradesForm = functions.https.onRequest((req, res) => {
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
      const {
        grade9_english,
        grade9_math,
        grade9_science,
        grade9_general,
        grade10_english,
        grade10_math,
        grade10_science,
        grade10_general,
        grade11_english,
        grade11_math,
        grade11_science,
        grade11_general
      } = req.body;

      // 3. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      try {
        await db.query('BEGIN');

        // Check if user exists in User table
        const userRes = await db.query(
          `SELECT user_id FROM "User" WHERE user_id = $1 LIMIT 1`,
          [uid]
        );
        if (userRes.rowCount === 0) {
          await db.query('ROLLBACK');
          await db.end();
          return res.status(400).json({
            message: 'User not found in database. Please complete registration first.'
          });
        }

        // Insert or update Grades_Form
        await db.query(
          `INSERT INTO "Grades_Form" (
            user_id,
            grade9_english, grade9_math, grade9_science, grade9_general,
            grade10_english, grade10_math, grade10_science, grade10_general,
            grade11_english, grade11_math, grade11_science, grade11_general,
            updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()
          )
          ON CONFLICT (user_id) DO UPDATE SET
            grade9_english = EXCLUDED.grade9_english,
            grade9_math = EXCLUDED.grade9_math,
            grade9_science = EXCLUDED.grade9_science,
            grade9_general = EXCLUDED.grade9_general,
            grade10_english = EXCLUDED.grade10_english,
            grade10_math = EXCLUDED.grade10_math,
            grade10_science = EXCLUDED.grade10_science,
            grade10_general = EXCLUDED.grade10_general,
            grade11_english = EXCLUDED.grade11_english,
            grade11_math = EXCLUDED.grade11_math,
            grade11_science = EXCLUDED.grade11_science,
            grade11_general = EXCLUDED.grade11_general,
            updated_at = NOW()
          `,
          [
            uid,
            grade9_english,
            grade9_math,
            grade9_science,
            grade9_general,
            grade10_english,
            grade10_math,
            grade10_science,
            grade10_general,
            grade11_english,
            grade11_math,
            grade11_science,
            grade11_general
          ]
        );

        await db.query('COMMIT');
        await db.end();

        return res.status(200).json({ message: 'Grades form saved successfully' });
      } catch (err) {
        await db.query('ROLLBACK');
        await db.end();
        throw err;
      }
    } catch (err) {
      console.error('Error in insertGradesForm:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});