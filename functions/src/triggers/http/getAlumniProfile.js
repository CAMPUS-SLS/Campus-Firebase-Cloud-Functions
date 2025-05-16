const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
const { Client } = require("pg");

if (!admin.apps.length) admin.initializeApp();

const getAlumniProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // ✅ Extract Bearer token
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing auth header" });

    const idToken = match[1];

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const db = new Client({
      user: "neondb_owner",
      host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
      database: "neondb",
      password: "npg_mQOGqHwl95Cd",
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      const { rows } = await db.query(`
        SELECT
          ap.alumni_profile_id AS "studentId",
          ap.photo_url AS "photoUrl",
          ap.student_number AS "studentNumber",
          ap.birth_place AS "birthPlace",
          ap.civil_status AS "civilStatus",
          ap.mobile_no AS "mobileNo",
          ap.telephone_no AS "telephoneNo",
          ap.facebook_id AS "facebookId",
          ap.alt_email AS "altEmail",
          ap.department_id AS "departmentId",
          ap.strand,
          ap.highest_degree AS "highestDegree",
          ap.year_graduated AS "yearGraduated",
          ap.current_work AS "currentWork",
          ap.linkedin_url AS "linkedinUrl",
          TO_CHAR(ap.last_updated, 'DD-Mon-YYYY') AS "lastUpdated",
          d.department_name AS department,
          
          ap.user_id AS alumni_user_id,
          up.user_id AS profile_user_id,
          up.gender AS "gender",
          up.birth_date AS "birthDate",
          up.nationality AS "nationality",
          up.first_name AS "firstName",
          up.middle_name AS "middleName",
          up.last_name AS "lastName",
          CONCAT_WS(' ', 
            COALESCE(up.first_name, ''), 
            COALESCE(up.middle_name, ''), 
            COALESCE(up.last_name, '')
          ) AS "fullName"
        FROM public."Alumni_Profiles" ap
        JOIN public."User_Profile" up ON ap.user_id = up.user_id
        JOIN public."Department" d ON ap.department_id = d.department_id
        WHERE ap.user_id = $1
        LIMIT 1;
      `, [uid]);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Alumni not found" });
      }

      const result = {};
      Object.entries(rows[0]).forEach(([key, value]) => {
        result[key] = value;
      });

      console.log("Returned Alumni Profile Data:", result);
      return res.status(200).json(result);
    } catch (err) {
      console.error("Error fetching alumni profile:", err);
      return res.status(500).json({ error: "Internal server error" });
    } finally {
      await db.end();
    }
  });
});

module.exports = { getAlumniProfile };
