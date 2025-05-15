const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

// PostgreSQL config
const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_mQOGqHwl95Cd',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// ✅ GET: Fetch feedback list
exports.getFeedback = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT
          af.alumni_feedback_id,
          af.user_id,
          up.first_name,
          up.last_name,
          af.email_address,
          af.year_graduated,
          af.program,
          af.message,
          af.created_at
        FROM "Alumni_Feedback" af
        LEFT JOIN "User_Profile" up ON af.user_id = up.user_id
        ORDER BY af.created_at DESC;
      `);

      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

exports.getFeedbackById = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const id = req.query.id

    if (!id) {
      return res.status(400).json({ error: "Missing feedback ID" })
    }

    try {
      const result = await pool.query(`
        SELECT
          af.alumni_feedback_id,
          af.user_id,
          af.email_address,
          af.year_graduated,
          af.program,
          af.message,
          af.created_at,
          up.first_name,
          up.last_name
        FROM "Alumni_Feedback" af
        LEFT JOIN "User_Profile" up ON af.user_id = up.user_id
        WHERE af.alumni_feedback_id = $1
      `, [id])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Feedback not found" })
      }

      res.status(200).json(result.rows[0])
    } catch (err) {
      console.error("Error fetching feedback by ID:", err)
      res.status(500).send("Internal Server Error")
    }
  })
})

