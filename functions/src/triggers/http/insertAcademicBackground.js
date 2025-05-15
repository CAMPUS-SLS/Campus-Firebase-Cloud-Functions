// functions/src/triggers/http/insertAcademicBackground.js

const { Client } = require('pg');
const { admin }  = require('../../config/firebase');
const functions  = require('firebase-functions');
const cors       = require('cors')({ origin: true });
require('dotenv').config();

exports.insertAcademicBackground = functions.https.onRequest((req, res) => {
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

      // 2. Parse + validate request body
      const { gradeLevel, schoolName, completionYear, shsStrand } = req.body;
      if (!gradeLevel || !schoolName || !completionYear) {
        return res.status(400).json({
          message: 'gradeLevel, schoolName and completionYear are required'
        });
      }

      // 3. Connect to Postgres
      if (!process.env.DATABASE_URL) {
        throw new Error('Missing DATABASE_URL');
      }
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 4. Ensure this user has a Student_Applicant record
      const saRes = await db.query(
        `SELECT user_id
           FROM "Student_Applicant"
          WHERE user_id = $1
          LIMIT 1`,
        [uid]
      );
      if (saRes.rowCount === 0) {
        await db.end();
        return res.status(400).json({
          message: 'No Student_Applicant record found for this user.'
        });
      }
      const userId = saRes.rows[0].user_id;

      // 5. Generate a unique PK for this Academic_Background row
      const rawId        = `ab_${uid.slice(0, 8)}_${Date.now()}`;
      const academicBgId = rawId.length > 20 ? rawId.slice(0, 20) : rawId;

      // 6. Insert into Academic_Background
      const insertSql = `
        INSERT INTO "Academic_Background" (
          academic_bg_id,
          user_id,
          grade_level,
          school_name,
          completion_year,
          shs_strand
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await db.query(insertSql, [
        academicBgId,
        userId,
        gradeLevel,
        schoolName,
        completionYear,
        shsStrand || null
      ]);

      await db.end();

      // 7. Return the new ID
      return res.status(200).json({
        message: 'Academic background saved',
        academicBgId
      });
    } catch (err) {
      console.error('Error in insertAcademicBackground:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});
