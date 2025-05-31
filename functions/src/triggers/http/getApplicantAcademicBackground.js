const { Client } = require('pg');
const { admin }  = require('../../config/firebase');
const functions  = require('firebase-functions');
const cors       = require('cors')({ origin: true });
require('dotenv').config();

exports.getApplicantAcademicBackground = functions.https.onRequest((req, res) => {
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

      // 2. Connect to Postgres
      if (!process.env.DATABASE_URL) {
        throw new Error('Missing DATABASE_URL');
      }
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 3. Fetch academic background for this user
      const result = await db.query(
        `SELECT academic_bg_id, grade_level, school_name, completion_year, shs_strand
           FROM "Academic_Background"
          WHERE user_id = $1
          ORDER BY completion_year DESC`,
        [uid]
      );
      await db.end();

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Academic background not found.' });
      }

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error in getApplicantAcademicBackground:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});