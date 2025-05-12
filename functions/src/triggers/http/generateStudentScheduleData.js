const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_mQOGqHwl95Cd',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

exports.getStudentSchedule = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const query = `
      SELECT
          c.course_id AS subject_code,
          c.course_title AS subject_desc,
          c.lec_units,
          c.lab_units,
          s.section_desc AS section,
          t.weekday AS day,
          t.timeslot_start AS startTime,
          t.timeslot_end AS endTime,
          rm.floor_no || ' ' || rm.building AS location,
          rm.room_no AS room,
          CONCAT(up.last_name, ', ', up.first_name) AS instructor
      FROM
          "Course" c
      JOIN
          "Timeslot" t ON c.course_id = t.course_id
      JOIN
          "Section" s ON t.section_id = s.section_id
      JOIN
          "Room" rm ON t.room_id = rm.room_id
      JOIN
          "Professor" p ON t.professor_id = p.professor_id
      JOIN
          "User_Profile" up ON p.user_id = up.user_id;
    `;

    try {
      const { rows } = await pool.query(query);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});


/* 
      SELECT
          c.course_id AS subject_code,
          c.course_title AS subject_desc,
          c.lec_units,
          c.lab_units,
          s.section_desc AS section,
          t.weekday AS day,
          t.timeslot_start AS startTime,
          t.timeslot_end AS endTime,
          rm.floor_no || ' ' || rm.building AS location,
          rm.room_no AS room,
          CONCAT(up.last_name, ', ', up.first_name) AS instructor
      FROM
          "Course" c
      JOIN
          "Timeslot" t ON c.course_id = t.course_id
      JOIN
          "Section" s ON t.section_id = s.section_id
      JOIN
          "Room" rm ON t.room_id = rm.room_id
      JOIN
          "Professor" p ON t.professor_id = p.professor_id
      JOIN
          "User_Profile" up ON p.user_id = up.user_id;
*/