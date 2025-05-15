// functions/src/triggers/http/insertPersonalInfo.js

const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config(); // Load DATABASE_URL

exports.insertPersonalInfo = functions.https.onRequest((req, res) => {
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
        familyName,
        firstName,
        middleName,
        otherName,
        gender,
        birthDate,
        birthPlace,
        mobileNo,
        email,
        houseNo,
        street,
        barangay,
        city,
        province,
        postalCode,
        region,
        nationality,
        civilStatus,
        workingStatus
      } = req.body;

      // 3. Connect to NeonDB
      if (!process.env.DATABASE_URL) {
        throw new Error('Missing DATABASE_URL');
      }
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 4. Check if user exists in Student_Applicant table
      const applicantRes = await db.query(
        `SELECT applicant_id FROM "Student_Applicant" WHERE user_id = $1 LIMIT 1`,
        [uid]
      );
      if (applicantRes.rowCount === 0) {
        await db.end();
        return res.status(400).json({ message: 'No Student_Applicant record found for this user.' });
      }

      // 5. Insert into personal_information
      const insertQuery = `
        INSERT INTO "personal_information" (
          family_name,
          first_name,
          middle_name,
          other_name,
          gender,
          birth_date,
          birth_place,
          mobile_no,
          email_address,
          house_no,
          street,
          barangay,
          city,
          province,
          postal_code,
          region,
          nationality,
          civil_status,
          working_status
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
        )
        RETURNING id;
      `;
      const values = [
        familyName,
        firstName,
        middleName || null,
        otherName || null,
        gender,
        birthDate,
        birthPlace || null,
        mobileNo || null,
        email || null,
        houseNo || null,
        street || null,
        barangay || null,
        city || null,
        province || null,
        postalCode || null,
        region || null,
        nationality || null,
        civilStatus || null,
        workingStatus || null
      ];
      const { rows } = await db.query(insertQuery, values);
      const recordId = rows[0].id;

      // 6. Create Student record
      const student_id = `stu_${uid.slice(0, 8)}`;
      await db.query(
        `INSERT INTO "Student" (student_id, user_id) VALUES ($1, $2)`,
        [student_id, uid]
      );

      await db.end();

      // 7. (Optional) add custom claim or other post-insert logic
      // e.g. await admin.auth().setCustomUserClaims(uid, { personalInfoId: recordId });

      return res.status(200).json({
        message: 'Personal information saved successfully',
        recordId,
        student_id
      });

    } catch (err) {
      console.error('Error in insertPersonalInfo:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});
