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

exports.getDocumentsAccordingToDepartment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {departmentid, newCredits, newGwa} = req.body;

    const query = `
    UPDATE "Graduation_Requirement"
    SET required_credits = $1, minimum_gwa = $2, ...
    WHERE department_id = $3;
    
    `
    const sql = query;

    try {
        chosenQuery = await pool.query(sql, [newCredits, newGwa, departmentid]);
        const { rows } = chosenQuery
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});
