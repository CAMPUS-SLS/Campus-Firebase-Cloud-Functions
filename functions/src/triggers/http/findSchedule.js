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

exports.findSchedule = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { info, searchType } = req.body;

    if (!info || !searchType) {
      return res.status(400).json({ error: 'Missing values' });
    }

    let query

    switch (searchType) {
        case "P":    
            query = `
            SELECT timeslot_id, first_name ||' '|| last_name AS professor, 
            timeslot_start, 
            timeslot_end, 
            weekday, course_title, 
            course_description, 
            room_no, section_desc, 
            section_id FROM
	    (
	    SELECT a.*, user_id, course_title, course_description, room_no, section_desc FROM "Timeslot" 
	    AS a 
	    LEFT JOIN 
	    "Professor" AS b ON a.professor_id = b.professor_id
	    LEFT JOIN
	    "Course" AS d ON d.course_id = a.course_id
	    LEFT JOIN
	    "Room" AS r ON r.room_id = a.room_id
	    LEFT JOIN
	    "Section" AS s ON s.section_id = a.section_id
	    ) AS a
	    LEFT JOIN "User_Profile" AS b ON a.user_id = b.user_id 
	        WHERE professor_id = $1
            `
            break;
        case "S":
            query = `
                        SELECT timeslot_id, first_name ||' '|| last_name AS professor, 
            timeslot_start, 
            timeslot_end, 
            weekday, course_title, 
            course_description, 
            room_no, section_desc, 
            section_id FROM
	    (
	    SELECT a.*, user_id, course_title, course_description, room_no, section_desc FROM "Timeslot" 
	    AS a 
	    LEFT JOIN 
	    "Professor" AS b ON a.professor_id = b.professor_id
	    LEFT JOIN
	    "Course" AS d ON d.course_id = a.course_id
	    LEFT JOIN
	    "Room" AS r ON r.room_id = a.room_id
	    LEFT JOIN
	    "Section" AS s ON s.section_id = a.section_id
	    ) AS a
	    LEFT JOIN "User_Profile" AS b ON a.user_id = b.user_id 
            WHERE section_id = $1;
            `
            break;
        case "R":
            query = `
                        SELECT timeslot_id, first_name ||' '|| last_name AS professor, 
            timeslot_start, 
            timeslot_end, 
            weekday, course_title, 
            course_description, 
            room_no, section_desc, 
            section_id FROM
	    (
	    SELECT a.*, user_id, course_title, course_description, room_no, section_desc FROM "Timeslot" 
	    AS a 
	    LEFT JOIN 
	    "Professor" AS b ON a.professor_id = b.professor_id
	    LEFT JOIN
	    "Course" AS d ON d.course_id = a.course_id
	    LEFT JOIN
	    "Room" AS r ON r.room_id = a.room_id
	    LEFT JOIN
	    "Section" AS s ON s.section_id = a.section_id
	    ) AS a
	    LEFT JOIN "User_Profile" AS b ON a.user_id = b.user_id  
            WHERE room_id = $1;
            `
            break;
        case "C":
            query = `
                        SELECT timeslot_id, first_name ||' '|| last_name AS professor, 
            timeslot_start, 
            timeslot_end, 
            weekday, course_title, 
            course_description, 
            room_no, section_desc, 
            section_id FROM
	    (
	    SELECT a.*, user_id, course_title, course_description, room_no, section_desc FROM "Timeslot" 
	    AS a 
	    LEFT JOIN 
	    "Professor" AS b ON a.professor_id = b.professor_id
	    LEFT JOIN
	    "Course" AS d ON d.course_id = a.course_id
	    LEFT JOIN
	    "Room" AS r ON r.room_id = a.room_id
	    LEFT JOIN
	    "Section" AS s ON s.section_id = a.section_id
	    ) AS a
	    LEFT JOIN "User_Profile" AS b ON a.user_id = b.user_id 
            WHERE course_id = $1;
            `
            break;
        default:
            return res.status(400).json({ error: 'Invalid search type' })     
    }

    const sql = query;

    try {
      const { rows } = await pool.query(sql, [info]);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/*
FRONTEND CODE SAMPLE

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/findSchedule", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    info: "COURSE002",
    searchType: "C" // P = Professor, R = Room, S = Section, C = Course
  })
})
.then(response => response.json())
.then(data => console.log("Response:", data))
.catch(error => console.error("Error:", error));

*/