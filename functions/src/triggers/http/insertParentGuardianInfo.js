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
      console.log("User ID from token:", uid);

      // 2. Parse request body
      const {
        fatherName, fatherAddress, fatherContact,
        motherName, motherAddress, motherContact,
        guardianName, guardianAddress, phoneHome, phoneWork,
        householdIncome
      } = req.body;

      // 3. Connect to NeonDB
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // First check if user exists in User table
      const userRes = await db.query(
        `SELECT user_id FROM "User" WHERE user_id = $1 LIMIT 1`,
        [uid]
      );
      console.log("User record found:", userRes.rowCount > 0);

      if (userRes.rowCount === 0) {
        await db.end();
        return res.status(400).json({ 
          message: 'User not found in database. Please complete registration first.',
          details: {
            hasUserRecord: false,
            hasStudentRecord: false
          }
        });
      }

      // Then check if student record exists
      const studentRes = await db.query(
        `SELECT student_id FROM "Student" WHERE user_id = $1 LIMIT 1`,
        [uid]
      );
      console.log("Student record found:", studentRes.rowCount > 0);

      if (studentRes.rowCount === 0) {
        await db.end();
        return res.status(400).json({ 
          message: 'No Student record found. Please complete student registration first.',
          details: {
            hasUserRecord: true,
            hasStudentRecord: false
          }
        });
      }
      const student_id = studentRes.rows[0].student_id;

      // Create address records and get their IDs
      const fatherAddressId = `addr_${uuidv4().slice(0, 8)}`;
      const motherAddressId = `addr_${uuidv4().slice(0, 8)}`;
      const guardianAddressId = `addr_${uuidv4().slice(0, 8)}`;

      // Insert addresses
      await db.query(
        `INSERT INTO "Address" (address_id, address_line) VALUES ($1, $2)`,
        [fatherAddressId, fatherAddress]
      );

      await db.query(
        `INSERT INTO "Address" (address_id, address_line) VALUES ($1, $2)`,
        [motherAddressId, motherAddress]
      );

      if (guardianAddress) {
        await db.query(
          `INSERT INTO "Address" (address_id, address_line) VALUES ($1, $2)`,
          [guardianAddressId, guardianAddress]
        );
      }

      // Insert or update Parents
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
          fatherAddressId,
          motherAddressId,
          fatherContact,
          motherContact
        ]
      );

      // Insert or update Guardian (only if guardian info is provided)
      if (guardianName || guardianAddress || phoneHome || phoneWork) {
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
            guardianAddressId,
            phoneHome,
            phoneWork
          ]
        );
      }

      // Update household_income in Student_Applicant
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
