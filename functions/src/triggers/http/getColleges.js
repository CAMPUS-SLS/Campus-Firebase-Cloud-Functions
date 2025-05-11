const functions  = require('firebase-functions');
const cors       = require('cors')({ origin: true });
const { Client } = require('pg');

const getColleges = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

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
      const { rows } = await db.query(`
        SELECT
          college_id AS id,
          college_name AS name
        FROM public."College"
        ORDER BY college_name ASC;
      `);
      return res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching colleges:', err);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await db.end();
    }
  });
});

module.exports = { getColleges };
