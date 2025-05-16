const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.getStudentMLInputs = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
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

      // 2. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 3. Fetch grades and household income
      const result = await db.query(
        `SELECT 
            g.grade9_english, g.grade9_math, g.grade9_science,
            g.grade10_english, g.grade10_math, g.grade10_science,
            g.grade11_english, g.grade11_math, g.grade11_science,
            p.household_income
         FROM "Grades_Form" g
         LEFT JOIN "Parent_Info" p ON g.user_id = p.user_id
         WHERE g.user_id = $1
         LIMIT 1`,
        [uid]
      );
      await db.end();

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Student input data not found.' });
      }

      return res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error('Error in getStudentMLInputs:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});