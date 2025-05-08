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

// ✅ GET Announcements with Category and Admin Info (basic version first)
exports.getAnnouncements = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT 
          a.announcement_id,
          a.title,
          a.status,
          a.date_published,
          c.category_name
        FROM "Announcements" a
        LEFT JOIN "Announcement_Category" c ON a.category_id = c.category_id
        ORDER BY a.date_published DESC NULLS LAST
      `);

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching announcements:", err.stack || err.message || err);
      return res.status(500).json({ error: "Internal server error" });
    }    
  });
});

exports.deleteAnnouncements = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "DELETE") {
      return res.status(405).send("Method Not Allowed");
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Missing or invalid announcement IDs." });
    }

    try {
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
      const query = `DELETE FROM "Announcements" WHERE announcement_id IN (${placeholders})`;
      await pool.query(query, ids);

      return res.status(200).json({ message: "Announcements deleted successfully." });
    } catch (error) {
      console.error("Error deleting announcements:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  });
});