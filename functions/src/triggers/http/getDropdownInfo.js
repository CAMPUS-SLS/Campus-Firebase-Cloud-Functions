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

exports.getDropdownInfo = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { getDepartment, getCourses, getSection, getRoom, getBuilding, getSectionAccordingTo, getFormattedCourses } = req.body;

    let query
    let params = [];

    if( getDepartment ){
        query = `SELECT * FROM "Department"
    `
    } else if( getSection ) {
        query = `SELECT *,
        CASE 
		WHEN year_level = 1 THEN '1st Year'
		WHEN year_level = 2 THEN '2nd Year'
		WHEN year_level = 3 THEN '3rd Year'
		WHEN year_level = 4 THEN '4th Year'
	ELSE '1st Year' END AS acad_term
        
        FROM "Section"
    `
    } else if( getCourses ) {
        query = `SELECT * FROM "Courses"
    `
    } else if( getRoom ) {
        query = `SELECT * FROM "Room"
    `
    } else if ( getBuilding ) {
      query = ` SELECT DISTINCT building FROM "Room"; 
      `
    }  else if( typeof getSectionAccordingTo === 'string' && getSectionAccordingTo.trim() !== '' ) {
        query = `SELECT * FROM "Section" WHERE department_id = $1
    `
    params = [getSectionAccordingTo]
    } else if( getFormattedCourses ) {
        query = `SELECT DISTINCT course_id, course_title, course_description,
CASE WHEN lec_units = 0 THEN 'false'
	ELSE 'true' END AS "hasLecSchedule",
	CASE WHEN lab_units = 0 THEN 'false'
	ELSE 'true' END AS "hasLabSchedule",
	lec_units,
	lab_units,
	lec_professor_id,
	lab_professor_id,
	department_id,
	CASE 
		WHEN year_level = 1 THEN '1st Year'
		WHEN year_level = 2 THEN '2nd Year'
		WHEN year_level = 3 THEN '3rd Year'
		WHEN year_level = 4 THEN '4th Year'
	ELSE '1st Year' END AS term,
	true_sect AS section_id
FROM (
SELECT a.*, a.section_id AS true_sect, course_title, course_description, d.weekday, lec_professor_id, d.section_id, 
lec_units, lab_units, lab_professor_id FROM (
SELECT course_id, section_id, a.department_id, term, a.year_level FROM "Section" a
	LEFT JOIN(
		SELECT a.*, department_id FROM "Curriculum_Courses_Fact" a
		LEFT JOIN "Curriculum" b ON a.curriculum_id = b.curriculum_id
	) b
	ON a.department_id = b.department_id
	WHERE a.year_level = b.year_level
) a 
LEFT JOIN "Course" b ON a.course_id = b.course_id
LEFT JOIN (SELECT weekday, professor_id AS lec_professor_id, section_id, room_id, course_id FROM "Timeslot" WHERE "isLab"='false') d ON a.course_id = d.course_id
LEFT JOIN (SELECT weekday, professor_id AS lab_professor_id, section_id, room_id, course_id FROM "Timeslot" WHERE "isLab"='true') e ON a.course_id = d.course_id
) 
    `
    }
    const sql = query;

    try {

        let chosenQuery
        chosenQuery = await pool.query(sql, params);
        const { rows } = chosenQuery
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/*
FRONTEND CODE SAMPLE

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/getDropdownInfo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
   getDepartment:true // 
  })
})
.then(response => response.json())
.then(data => console.log("Response:", data))
.catch(error => console.error("Error:", error));

*/