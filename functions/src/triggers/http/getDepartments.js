const functions  = require('firebase-functions');
const cors       = require('cors')({ origin: true });
const { Client } = require('pg');

const getDepartments = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const collegeId = req.query.college_id;  // optional filter

    // Connect to Postgres
    const db = new Client({
      user:     'neondb_owner',
      host:     'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
      database: 'neondb',
      password: 'npg_mQOGqHwl95Cd',
      port:     5432,
      ssl:      { rejectUnauthorized: false },
    });
    await db.connect();

    try {
      let result;
      if (collegeId) {
        result = await db.query(
          `
            SELECT
              department_id AS id,
              department_name AS name
            FROM public."Department"
            WHERE college_id = $1
            ORDER BY department_name ASC;
          `,
          [collegeId]
        );
      } else {
        result = await db.query(`
          SELECT
            department_id AS id,
            department_name AS name
          FROM public."Department"
          ORDER BY department_name ASC;
        `);
      }
      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('Error fetching departments:', err);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await db.end();
    }
  });
});

module.exports = { getDepartments };
