const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Client } = require("pg");

 const pool = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await pool.connect();


exports.getProfessorInfo = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { info, getCourses, getAvailability, getProfAccordingtoCourse, getAll } = req.body;

    if (!info) {
      return res.status(400).json({ error: 'Missing values' });
    }

    let query

    if(getCourses){
        query = `SELECT "Professor_Load".*, course_title, course_description  FROM "Professor_Load" 
        LEFT JOIN "Course" ON "Professor_Load".course_id = "Course".course_id
        WHERE professor_id = $1
    `
    } else if(getAvailability) {
        query = `
        SELECT * FROM "Professor_Availability" WHERE professor_id = $1
    `
    } else if(getAll){
        query = `SELECT 
        "Professor".professor_id, 
        "Professor".employment_status,
        photo_url,
        email,
        first_name ||' '|| last_name AS name,
        5.0 AS rating

        FROM "Professor" 
        LEFT JOIN "User" ON "User".user_id = "Professor".user_id
        LEFT JOIN "User_Profile" ON "User_Profile".user_id = "Professor".user_id
    `
    } else if(getProfAccordingtoCourse) {
        query = `SELECT "Professor_Load".*, course_title, course_description  FROM "Professor_Load" 
        LEFT JOIN "Course" ON "Professor_Load".course_id = "Course".course_id
        WHERE "Course".course_id = $1
        `
    } else {
        query = `SELECT * FROM "Professor" WHERE professor_id = $1
        `
    }

    const sql = query;

    try {
        let chosenQuery
        if(getAll){
        chosenQuery = await pool.query(sql);
        } else {
        chosenQuery = await pool.query(sql, [info]);
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

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/getProfessorInfo", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    info: "P001",
    getCourses: true // 
  })
})
.then(response => response.json())
.then(data => console.log("Response:", data))
.catch(error => console.error("Error:", error));

*/