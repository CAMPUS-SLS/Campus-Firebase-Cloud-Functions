const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

// Neon DB connection setup
const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_mQOGqHwl95Cd',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// Cloud Function to get alumni list
exports.getAlumniList = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const query = `
      SELECT 
        ap.student_number AS "alumniNo",
        up.first_name AS "firstName",
        up.middle_name AS "middleName",
        up.last_name AS "lastName",
        up.auxillary_name AS "auxiliaryName",
        up.gender,
        up.birth_date AS "birthday",
        ap.birth_place AS "birthplace",
        up.nationality,
        ap.civil_status,
        ap.mobile_no AS "mobileNumber",
        ap.telephone_no AS "telephone_no",
        ap.alt_email AS "altEmail",
        u.email,
        ap.facebook_id AS "facebook_id",   -- fixed: from ap, not u
        ap.linkedin_url AS "linkedin_url", -- fixed: from ap, not u
        ap.photo_url AS "photo_url"
        FROM "Alumni_Profiles" ap
        JOIN "User" u ON ap.user_id = u.user_id
        JOIN "User_Profile" up ON up.user_id = u.user_id
        ORDER BY ap.student_number;
    
      `;

      const result = await pool.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching alumni list:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

exports.getAlumniCardApplications = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT 
          aca.alumni_card_application_id,
          CONCAT(up.first_name, ' ', 
                 COALESCE(up.middle_name || ' ', ''), 
                 up.last_name, 
                 COALESCE(' ' || up.auxillary_name, '')) AS full_name,
          aca.application_type,
          TO_CHAR(aca.process_date, 'MM-DD-YYYY') AS request_date,
          aca.status
        FROM "Alumni_Card_Application" aca
        JOIN "User" u ON aca.user_id = u.user_id
        JOIN "User_Profile" up ON up.user_id = u.user_id
        ORDER BY aca.process_date DESC;
      `);

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching alumni card applications:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});