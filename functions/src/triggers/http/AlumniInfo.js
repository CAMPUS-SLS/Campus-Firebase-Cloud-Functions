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
        u.user_id,
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

exports.updateAlumni = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {
      user_id,
      firstName,
      middleName,
      lastName,
      auxiliaryName,
      gender,
      birthday,
      birthplace,
      nationality,
      civilStatus,
      mobileNumber,
      telNo,
      email,
      altEmail,
      facebookId,
      linkedinId,
      profileImage,
    } = req.body;

    console.log("Received user_id:", user_id);
    console.log("Full body:", req.body);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update User table
      await client.query(
        `
        UPDATE "User"
        SET 
          email = $1,
          photo_url = $2
        WHERE user_id = $3
        `,
        [email, profileImage, user_id]
      );

      // Update User_Profile table
      await client.query(
        `
        UPDATE "User_Profile"
        SET 
          first_name = $1,
          middle_name = $2,
          last_name = $3,
          auxillary_name = $4,
          gender = $5,
          birth_date = $6,
          nationality = $7
        WHERE user_id = $8
        `,
        [
          firstName,
          middleName,
          lastName,
          auxiliaryName,
          gender,
          birthday,
          nationality,
          user_id,
        ]
      );

      // Update Alumni_Profiles table
      await client.query(
        `
        UPDATE "Alumni_Profiles"
        SET 
          birth_place = $1,
          civil_status = $2,
          mobile_no = $3,
          telephone_no = $4,
          alt_email = $5,
          facebook_id = $6,
          linkedin_url = $7,
          photo_url = $8,
          last_updated = CURRENT_DATE
        WHERE user_id = $9
        `,
        [
          birthplace,
          civilStatus,
          mobileNumber,
          telNo,
          altEmail,
          facebookId,
          linkedinId,
          profileImage,
          user_id,
        ]
      );

      await client.query("COMMIT");
      return res.status(200).json({ message: "Alumni data updated successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update failed:", error);
      return res.status(500).json({ error: "Update failed", details: error.message });
    } finally {
      client.release();
    }
  });
});