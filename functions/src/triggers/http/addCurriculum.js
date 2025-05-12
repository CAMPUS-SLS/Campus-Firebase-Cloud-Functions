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

    const { curriculumName, departmentid, acadyear, acadterm, effectiveYear } = req.body;

    if (!curriculumName || !departmentid || !acadyear || !acadterm || !effectiveYear) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = "CURR"+ Date.now()

    const sql = `
      INSERT INTO "Curriculum"(curriculum_id, department_id, curriculum_name, acad_year, acad_term, effective_start_year, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *

    `;

    const values = [
      id,
      departmentid, 
      curriculumName,
      acadyear, 
      acadterm, 
      effectiveYear,
    ];

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
    effectiveYear: 2000,
  })
})

*/