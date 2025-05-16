// functions/src/triggers/http/registerApplicant.js

const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const { ref } = require('firebase-functions/v1/database');
const cors = require('cors')({ origin: true });
require('dotenv').config(); // Load local .env variables

exports.registerApplicant = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
      // 1. Verify Firebase token
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // 2. Parse request body
      const {
        familyName, firstName, middleName, otherName,
        gender, birthDate, yearTaken, mobile, email, referenceNumber
      } = req.body;

      // 3. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 4. Get role_id for 'Applicant'
      const roleRes = await db.query(
        `SELECT role_id FROM "Role" WHERE role = 'Applicant' LIMIT 1`
      );
      if (roleRes.rowCount === 0) {
        await db.end();
        return res.status(500).json({ message: "Role 'Applicant' not found" });
      }
      const role_id = roleRes.rows[0].role_id;

      // 5. Insert into "User"
      await db.query(
        `INSERT INTO "User" (user_id, role_id, email, password) VALUES ($1, $2, $3, $4)`,
        [uid, role_id, email, referenceNumber]
      );

      // 6. Insert into "User_Profile"
      const user_profile_id = `up_${uid.slice(0, 8)}`;
      await db.query(
        `INSERT INTO "User_Profile" (
          user_profile_id, user_id, first_name, middle_name,
          last_name, auxillary_name, birth_date, gender, contact_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          user_profile_id,
          uid,
          firstName,
          middleName || null,
          familyName,
          otherName || 'N/A',
          birthDate,
          gender,
          mobile
        ]
      );

      // 7. Insert into "Student_Applicant"
      const applicant_id = `sa_${uid.slice(0, 8)}`;
      await db.query(
        `INSERT INTO "Student_Applicant" (
          applicant_id, user_id, applicant_number, reference_number, year_taken
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          applicant_id,
          uid,
          Math.floor(100000 + Math.random() * 900000),
          referenceNumber,
          parseInt(yearTaken, 10)
        ]
      );

      await db.end();

      // 8. Set custom Firebase Auth claims
      await admin.auth().setCustomUserClaims(uid, { role: 'applicant' });

      return res.status(200).json({ message: "Applicant registered successfully with role" });

    } catch (err) {
      console.error('Error in registerApplicant:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});
