const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require("cors")({ origin: true });
require("dotenv").config();

exports.getStudentCourses = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "Missing user_id" });
    }

    try {
      const db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      await db.connect();

      // 📘 Query courses assigned to the student's department curriculum
      const result = await db.query(`
        SELECT DISTINCT co.course_id, co.course_title
        FROM "Student" s
        JOIN "Section" sec ON s.section_id = sec.section_id
        JOIN "Curriculum" cur ON sec.department_id = cur.department_id
        JOIN "Curriculum_Courses_Fact" ccf ON cur.curriculum_id = ccf.curriculum_id
        JOIN "Course" co ON ccf.course_id = co.course_id
        WHERE s.user_id = $1
      `, [user_id]);

      await db.end();

      return res.status(200).json({ courses: result.rows });
    } catch (err) {
      console.error("Error fetching student courses:", err);
      return res.status(500).json({ message: "Server error: " + err.message });
    }
  });
});
