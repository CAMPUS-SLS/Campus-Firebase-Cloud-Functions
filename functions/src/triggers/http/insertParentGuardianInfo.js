const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

exports.insertParentGuardianInfo = functions.https.onRequest((req, res) => {
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
        fatherName, fatherAddress, fatherContact,
        motherName, motherAddress, motherContact,
        guardianName, guardianAddress, phoneHome, phoneWork,
        householdIncome // Now used to update Student_Applicant
      } = req.body;

      // 3. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 4. Get student_id for this user
      const studentRes = await db.query(
        `SELECT student_id FROM "Student" WHERE user_id = $1 LIMIT 1`,
        [uid]
      );
      if (studentRes.rowCount === 0) {
        await db.end();
        return res.status(400).json({ message: 'No Student record found for this user.' });
      }
      const student_id = studentRes.rows[0].student_id;

      // 5. Insert or update Parents
      let parents_id = `par_${student_id}`;
      await db.query(
        `INSERT INTO "Parents" (
          parents_id, student_id, father_name, mother_name,
          father_address_id, mother_address_id, father_contact_no, mother_contact_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (student_id) DO UPDATE SET
          father_name = EXCLUDED.father_name,
          mother_name = EXCLUDED.mother_name,
          father_address_id = EXCLUDED.father_address_id,
          mother_address_id = EXCLUDED.mother_address_id,
          father_contact_no = EXCLUDED.father_contact_no,
          mother_contact_no = EXCLUDED.mother_contact_no
        `,
        [
          parents_id,
          student_id,
          fatherName,
          motherName,
          fatherAddress,
          motherAddress,
          fatherContact,
          motherContact
        ]
      );

      // 6. Insert or update Guardian
      let guardians_id = `gua_${student_id}`;
      await db.query(
        `INSERT INTO "Guardian" (
          guardians_id, student_id, guardian_name, address_id, home_phone_no, work_phone_no
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (student_id) DO UPDATE SET
          guardian_name = EXCLUDED.guardian_name,
          address_id = EXCLUDED.address_id,
          home_phone_no = EXCLUDED.home_phone_no,
          work_phone_no = EXCLUDED.work_phone_no
        `,
        [
          guardians_id,
          student_id,
          guardianName,
          guardianAddress,
          phoneHome,
          phoneWork
        ]
      );

      // 7. Update household_income in Student_Applicant
      await db.query(
        `UPDATE "Student_Applicant" SET household_income = $1 WHERE user_id = $2`,
        [householdIncome, uid]
      );

      await db.end();

      return res.status(200).json({ message: 'Parent and guardian info saved successfully' });
    } catch (err) {
      console.error('Error in insertParentGuardianInfo:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});
