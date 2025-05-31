const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

exports.insertAlumniRelativeInfo = functions.https.onRequest((req, res) => {
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
      const { relatives } = req.body; // expects: [{ alumniName, relationship, college, batch, contactNumber }, ...]
      if (!Array.isArray(relatives)) {
        return res.status(400).json({ message: 'Relatives must be an array.' });
      }

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();
      await db.query('BEGIN');

      // Optionally: delete previous entries for this user before inserting new ones
      await db.query(`DELETE FROM "Applicant_Alumni_Relative" WHERE user_id = $1`, [uid]);

      for (const entry of relatives) {
        await db.query(
          `INSERT INTO "Applicant_Alumni_Relative" (
            alumni_relative_id, user_id, alumni_name, relationship, college, batch, contact_number, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            `alumrel_${uuidv4().slice(0, 8)}`,
            uid,
            entry.alumniName,
            entry.relationship,
            entry.college,
            entry.batch,
            entry.contactNumber
          ]
        );
      }

      await db.query('COMMIT');
      await db.end();

      return res.status(200).json({ message: 'Alumni relative info saved successfully.' });
    } catch (err) {
      console.error('Error in insertAlumniRelativeInfo:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});