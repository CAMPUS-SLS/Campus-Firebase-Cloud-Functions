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

exports.getProfessorInfo = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { info, getCourses, getAvailability } = req.body;

    if (!info) {
      return res.status(400).json({ error: 'Missing values' });
    }

    let query

    if(getCourses){
        query = `SELECT * FROM "Professor_Load" WHERE professor_id = $1
    `
    } else if(getAvailability) {
        query = `
        SELECT * FROM "Professor_Availability" WHERE professor_id = $1
    `
    } else {
        query = `SELECT * FROM "Professor" WHERE professor_id = $1
    `
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