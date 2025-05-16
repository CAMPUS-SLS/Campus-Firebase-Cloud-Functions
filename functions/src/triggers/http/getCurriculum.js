const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Client } = require("pg");
require("dotenv").config();

exports.getCurriculum = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { info, getCourses, searchRoom, searchProfessorByName } = req.body;

    if (!info) {
      return res.status(400).json({ error: 'Missing values' });
    }

    const pool = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });

    let query

    if(getCourses){
        query = `SELECT * FROM "Curriculum_Courses_Fact" WHERE curriculum_id =$1
    `
    } else if(searchRoom){
      query = `  SELECT room_id FROM "Room" WHERE CAST(room_no AS TEXT) = $1

      `
    } else if(searchProfessorByName) {
      query = `
      SELECT professor_id FROM "Professor" a LEFT JOIN "User_Profile" b ON a.user_id = b.user_id
      WHERE first_name || ' ' || last_name = $1
      `
    } else {
        query = `SELECT d.*, curriculum_name, acad_year FROM "Department" d LEFT JOIN
"Curriculum" e ON 
d.department_id = e.department_id
WHERE is_active = 'true'
    `
    }

    const sql = query;

    try {
        await pool.connect();
        let chosenQuery
        if(getCourses||searchRoom||searchProfessorByName){
        chosenQuery = await pool.query(sql, [info]);
        } else {
        chosenQuery = await pool.query(sql);
        }

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

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/getCurriculum", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    info: "CURR001",
    getCourses: true // 
  })
})
.then(response => response.json())
.then(data => console.log("Response:", data))
.catch(error => console.error("Error:", error));

*/