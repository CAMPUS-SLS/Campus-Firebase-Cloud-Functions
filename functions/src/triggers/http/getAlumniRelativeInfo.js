const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config();

exports.getAlumniRelativeInfo = functions.https.onRequest((req, res) => {
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

      // 3. Fetch alumni relatives for this user
      const result = await db.query(
        `SELECT alumni_relative_id, alumni_name, relationship, college, batch, contact_number
         FROM "Applicant_Alumni_Relative"
         WHERE user_id = $1
         ORDER BY created_at ASC`,
        [uid]
      );
      await db.end();

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error in getAlumniRelativeInfo:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});