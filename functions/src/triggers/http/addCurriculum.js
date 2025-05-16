const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Client } = require("pg");
require("dotenv").config();

exports.addCurriculum = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      const { curriculumName, departmentid, acadyear, acadterm, effectiveYear, newCourse, curriculumid } = req.body;

      // Validate required fields
      if (!curriculumName || !departmentid || !acadyear || !acadterm || !effectiveYear) {
        if (!(newCourse && curriculumid)) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
      }

      if (newCourse && curriculumid) {
        // ✅ Add course to curriculum
        const alternateid = "CCF" + Date.now();
        const result = await client.query(
          `INSERT INTO "Curriculum_Courses_Fact" 
           (curr_course_id, curriculum_id, course_id, year_level, term)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [alternateid, curriculumid, newCourse, acadyear, acadterm]
        );
        await client.end();
        return res.status(201).json({ curriculumCourse: result.rows[0] });
      } else {
        // ✅ Create new curriculum using transaction
        try {
          await client.query('BEGIN');

          const id = "CURR" + Date.now();

          await client.query(
            `UPDATE "Curriculum" SET is_active = false WHERE department_id = $1`,
            [departmentid]
          );

          const result = await client.query(
            `INSERT INTO "Curriculum"
             (curriculum_id, department_id, curriculum_name, 
              acad_year, acad_term, effective_start_year, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             RETURNING *`,
            [id, departmentid, curriculumName, acadyear, acadterm, effectiveYear]
          );

          await client.query('COMMIT');
          await client.end();
          return res.status(201).json({ curriculum: result.rows[0] });
        } catch (error) {
          await client.query('ROLLBACK');
          await client.end();
          throw error;
        }
      }
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        details: error.message
      });
    }
  });
});
