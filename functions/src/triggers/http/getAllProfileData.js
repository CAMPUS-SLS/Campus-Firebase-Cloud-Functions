const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { admin } = require("../../config/firebase");
require("dotenv").config();

exports.getAllProfileData = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const { user_id } = req.body;
      const finalUserId = user_id || uid;

      if (!finalUserId) {
        return res.status(400).json({ message: "Missing user_id parameter" });
      }

      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });

      await db.connect();

      const personalQuery = `
        SELECT 
          user_id,
          first_name,
          middle_name,
          last_name,
          auxillary_name,
          birth_date,
          gender,
          nationality,
          religion,
          contact_no,
          working_status,
          acr_no,
          income_status,
          legal_status,
          employer,
          address_id
        FROM "User_Profile"
        WHERE user_id = $1
      `;

      const courseQuery = `
        SELECT 
          d.department_name AS course,
          NULL AS degree,
          c.college_name AS college,
          NULL AS status
        FROM "Department" d
        JOIN "College" c ON d.college_id = c.college_id
        WHERE d.department_id = 'DEP001' AND c.college_id = 'COL001'
      `;

      const parentQuery = `
        SELECT 
          father_name,
          father_address,
          father_contact,
          mother_name,
          mother_address,
          mother_contact,
          guardian_name,
          guardian_address,
          phone_home,
          phone_work
        FROM "Parent_Info"
        WHERE user_id = $1
      `;

      const [personalResult, courseResult, parentResult] = await Promise.all([
        db.query(personalQuery, [finalUserId]),
        db.query(courseQuery),
        db.query(parentQuery, [finalUserId]),
      ]);

      await db.end();

      if (personalResult.rows.length === 0) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      return res.status(200).json({
        student: personalResult.rows[0],
        courseInfo: courseResult.rows[0] || {},
        parentInfo: parentResult.rows[0] || {},
      });
    } catch (err) {
      console.error("Error in getAllProfileData:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
