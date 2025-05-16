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

    try {
      const { curriculumName, departmentid, acadyear, acadterm, effectiveYear, newCourse, curriculumid } = req.body;

      // Validate required fields
      if (!curriculumName || !departmentid || !acadyear || !acadterm || !effectiveYear) {
        if (!(newCourse && curriculumid)) { // If not adding course case
          return res.status(400).json({ error: 'Missing required fields' });
        }
      }

      if (newCourse && curriculumid) {
        // Add course to curriculum
        const alternateid = "CCF"+ Date.now();
        const result = await pool.query(
          `INSERT INTO "Curriculum_Courses_Fact" 
           (curr_course_id, curriculum_id, course_id, year_level, term)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [alternateid, curriculumid, newCourse, acadyear, acadterm]
        );
        return res.status(201).json({ curriculumCourse: result.rows[0] });
      } else {
        // Create new curriculum (with transaction)
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          const id = "CURR"+ Date.now();

          // Deactivate other curricula in same department
          await client.query(
            `UPDATE "Curriculum" 
             SET is_active = false
             WHERE department_id = $1`,
            [departmentid]
          );

          // Insert new active curriculum
          const result = await client.query(
            `INSERT INTO "Curriculum"
             (curriculum_id, department_id, curriculum_name, 
              acad_year, acad_term, effective_start_year, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             RETURNING *`,
            [id, departmentid, curriculumName, acadyear, acadterm, effectiveYear]
          );

          await client.query('COMMIT');
          return res.status(201).json({ curriculum: result.rows[0] });
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
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