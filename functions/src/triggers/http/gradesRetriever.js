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

exports.gradesRetriever = functions.https.onRequest(async (req, res) => {
    cors(req, res, async () => {
      console.log("Received user_id:", req.query.user_id); // Log the user_id
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }
  
      const query = `
        SELECT
          s.user_id,
          g.student_id,
          g.course_id,
          c.course_id AS subjectCode,
          c.course_title AS subjectName,
          c.lec_units,
          c.lab_units,
          g.acad_year || '_' || g.acad_term AS semesterId,
          g.grade,
          g.acad_year AS academicYear,
          g.acad_term AS term,
          co.college_name AS college,
          d.department_name AS program
        FROM
          "Grades" g
        JOIN
          "Course" c ON g.course_id = c.course_id
        JOIN
          "Enrollment" e ON g.student_id = e.student_id
        JOIN
          "Department" d ON d.department_id = e.department_id
        JOIN
          "College" co ON d.college_id = co.college_id
        JOIN
          "Student" s ON s.student_id = g.student_id;
      `;
  
      try {
        const { rows } = await pool.query(query);
        console.log("Query result rows:", rows); // Log the query results
  
        // Return the query results as JSON
        return res.status(200).json(rows);
      } catch (error) {
        console.error('Database error:', error.message);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  });