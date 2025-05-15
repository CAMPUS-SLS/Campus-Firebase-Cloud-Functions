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

      // 🔍 Get student_id and section_id
      const studentRes = await db.query(
        `SELECT student_id, section_id FROM "Student" WHERE user_id = $1`,
        [userId]
      );

      if (studentRes.rowCount === 0) {
        await db.end();
        return res.status(404).json({ message: "Student not found." });
      }

      const { student_id, section_id } = studentRes.rows[0];

      // 🔍 Fetch professors the student has NOT yet evaluated for the current term
      const facultyRes = await db.query(
        `
        SELECT 
          pl.prof_load_id,
          c.course_title,
          CONCAT(up.first_name, ' ', up.last_name) AS professor_name
        FROM "Professor_Load" pl
        JOIN "Course" c ON c.course_id = pl.course_id
        JOIN "Professor" pr ON pr.professor_id = pl.professor_id
        JOIN "User_Profile" up ON up.user_id = pr.user_id
        LEFT JOIN "Student_Prof_Track" sp ON 
          sp.student_id = $1 AND 
          sp.prof_load_id = pl.prof_load_id AND 
          sp.status = 'Submitted'
        WHERE 
          pl.section_id = $2
          AND pl.academic_year = $3
          AND pl.academic_term = $4
          AND sp.sp_track_id IS NULL
        `,
        [student_id, section_id, academicYear, academicTerm]
      );

      await db.end();

      return res.status(200).json({
        faculty: facultyRes.rows,
      });

    } catch (err) {
      console.error("Error in getFacultyListForStudent:", err);
      await db.end();
      return res.status(500).json({
        message: "Server error: " + err.message,
      });
    }
  });
});
