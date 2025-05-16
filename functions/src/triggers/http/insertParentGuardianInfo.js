const { Client } = require('pg');
const { admin } = require('../../config/firebase');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
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
        householdIncome
      } = req.body;

      // Validate required fields
      if (!fatherName || !fatherAddress || !fatherContact ||
          !motherName || !motherAddress || !motherContact ||
          !householdIncome) {
        return res.status(400).json({ message: 'Missing required parent fields.' });
      }

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

        // Insert or update Parent_Info
        await db.query(
          `INSERT INTO "Parent_Info" (
            user_id, father_name, father_address, father_contact,
            mother_name, mother_address, mother_contact,
            guardian_name, guardian_address, phone_home, phone_work, household_income, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
          ON CONFLICT (user_id) DO UPDATE SET
            father_name = EXCLUDED.father_name,
            father_address = EXCLUDED.father_address,
            father_contact = EXCLUDED.father_contact,
            mother_name = EXCLUDED.mother_name,
            mother_address = EXCLUDED.mother_address,
            mother_contact = EXCLUDED.mother_contact,
            guardian_name = EXCLUDED.guardian_name,
            guardian_address = EXCLUDED.guardian_address,
            phone_home = EXCLUDED.phone_home,
            phone_work = EXCLUDED.phone_work,
            household_income = EXCLUDED.household_income,
            updated_at = NOW()
          `,
          [
            uid,
            fatherName,
            fatherAddress,
            fatherContact,
            motherName,
            motherAddress,
            motherContact,
            guardianName,
            guardianAddress,
            phoneHome,
            phoneWork,
            householdIncome
          ]
        );

        await db.query('COMMIT');
        await db.end();

        return res.status(200).json({ message: 'Parent and guardian info saved successfully' });
      } catch (err) {
        await db.query('ROLLBACK');
        await db.end();
        throw err;
      }
    } catch (err) {
      console.error('Error in insertParentGuardianInfo:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    }
  });
});
