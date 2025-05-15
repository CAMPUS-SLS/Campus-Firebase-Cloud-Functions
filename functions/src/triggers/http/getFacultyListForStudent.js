const { Client } = require("pg");
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getFacultyListForStudent = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { userId, academicYear, academicTerm } = req.query;

    if (!userId || !academicYear || !academicTerm) {
      return res.status(400).json({
        message: "Missing required parameters: userId, academicYear, academicTerm",
      });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      // Get student_id and section_id using user_id
      const studentRes = await db.query(
        `SELECT student_id, section_id FROM "Student" WHERE user_id = $1`,
        [userId]
      );

      if (studentRes.rowCount === 0) {
        return res.status(404).json({ message: "Student not found." });
      }

      const { student_id, section_id } = studentRes.rows[0];

      // Get professors teaching in the same section and term
      const facultyRes = await db.query(
        `
        SELECT 
          pl.prof_load_id,
          c.course_title,
          (COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '')) AS professor_name,
          sp.status
        FROM "Professor_Load" pl
        JOIN "Course" c ON c.course_id = pl.course_id
        JOIN "Professor" pr ON pr.professor_id = pl.professor_id
        JOIN "User_Profile" up ON up.user_id = pr.user_id
        LEFT JOIN "Student_Prof_Track" sp 
          ON sp.student_id = $1 
          AND sp.prof_load_id = pl.prof_load_id
        WHERE 
          pl.section_id = $2
          AND pl.academic_year = $3
          AND pl.academic_term = $4
        ORDER BY professor_name ASC
        `,
        [student_id, section_id, academicYear, academicTerm]
      );

      return res.status(200).json({
        faculty: facultyRes.rows,
      });

    } catch (err) {
      console.error("❌ Server error:", err.message);
      return res.status(500).json({ message: "Server error: " + err.message });
    } finally {
      await db.end();
    }
  });
});
