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

exports.addCurriculum = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { curriculumName, departmentid, acadyear, acadterm, effectiveYear, newCourse, curriculumid } = req.body;

    const id = "CURR"+ Date.now()
    const alternateid = "CCF"+ Date.now()

    let query

    query = `
      INSERT INTO "Curriculum"(curriculum_id, department_id, curriculum_name, acad_year, acad_term, effective_start_year, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true);

      UPDATE "Curriculum" 
      SET is_active = 'false'
      WHERE department_id = $2;

    `; 

    if(newCourse&&curriculumid){
    query = `
    INSERT INTO "Curriculum_Courses_Fact"(curr_course_id, curriculum_id, course_id, year_level,term)
    VALUES ($1, $2, $3, $4, $5)
    `
    }

    const sql = query

    let selectedValues 

    selectedValues = [
      id,
      departmentid, 
      curriculumName,
      acadyear, 
      acadterm, 
      effectiveYear,
    ];

    if(newCourse&&curriculumid){
      selectedValues = [
        alternateid,
        curriculumid,
        newCourse,
        acadyear,
        acadterm
      ];
    }

    const values = selectedValues

    try {
      const result = await pool.query(sql, values);
      return res.status(201).json({ timeslot: result.rows[0] });
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/*
FRONTEND CODE SAMPLE

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/addCurriculum", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    curriculumName: "Rizzlum", 
    departmentid: "DEP001", 
    acadyear: "Rizzler", 
    acadterm: "Rizzler", 
    effectiveYear: 2000
  })
})

//ALTERNATE CODE TO ADD A COURSE TO A CURRICULUM

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/addCurriculum", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    curriculumid: "CURR001"
    newCourse: "COURSE001", 
    acadyear: 1, 
    acadterm: "2nd Semester", 
  })
})

*/