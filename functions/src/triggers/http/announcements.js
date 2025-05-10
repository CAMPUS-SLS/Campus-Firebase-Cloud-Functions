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
          a.content,
          a.status,
          a.date_published,
          a.category_id,
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


exports.getAnnouncementCategories = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const result = await pool.query(
        `SELECT category_id, category_name FROM "Announcement_Category" ORDER BY category_name`
      );
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).send("Failed to fetch categories");
    }
  });
});

exports.createAnnouncement = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { title, content, category_id } = req.body;
    if (!title || !content || !category_id) {
      return res.status(400).send("Missing required fields.");
    }

    try {
      // 1. Get the latest announcement_id
      const result = await pool.query(
        `SELECT announcement_id FROM "Announcements" ORDER BY announcement_id DESC LIMIT 1`
      );

      let newId;
      if (result.rows.length === 0) {
        newId = "ANN001";
      } else {
        const lastId = result.rows[0].announcement_id; // e.g. 'ANN004'
        const numeric = parseInt(lastId.replace("ANN", ""), 10) + 1;
        newId = `ANN${numeric.toString().padStart(3, "0")}`;
      }

      // 2. Insert new row
      const insert = await pool.query(
        `INSERT INTO "Announcements" 
   (announcement_id, category_id, admin_id, title, content, status, date_created, date_published)
   VALUES ($1, $2, $3, $4, $5, 'Published', CURRENT_DATE, CURRENT_DATE)
   RETURNING *`,
        [newId, category_id, "A001", title, content]
      );      

      res.status(201).json(insert.rows[0]);
    } catch (err) {
      console.error("❌ Error creating announcement:", err);
      res.status(500).send("Internal server error");
    }
  });
});

exports.addAnnouncementCategory = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).send("Category name is required.");
    }

    try {
      // Get last category_id like 'CAT007'
      const result = await pool.query(
        `SELECT category_id FROM "Announcement_Category" ORDER BY category_id DESC LIMIT 1`
      );

      let newId;
      if (result.rows.length === 0) {
        newId = "CAT001";
      } else {
        const lastId = result.rows[0].category_id;
        const num = parseInt(lastId.replace("CAT", ""), 10) + 1;
        newId = `CAT${num.toString().padStart(3, "0")}`;
      }

      await pool.query(
        `INSERT INTO "Announcement_Category" (category_id, category_name)
         VALUES ($1, $2)`,
        [newId, name.trim()]
      );

      res.status(201).json({ category_id: newId });
    } catch (err) {
      console.error("Error inserting category:", err);
      res.status(500).send("Failed to add category");
    }
  });
});

exports.updateAnnouncement = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).send("Method Not Allowed");
    }

    const { announcement_id, title, content, category_id } = req.body;

    if (
      typeof announcement_id !== "string" ||
      typeof title !== "string" ||
      typeof content !== "string" ||
      typeof category_id !== "string" ||
      !announcement_id.trim() ||
      !title.trim() ||
      !content.trim() ||
      !category_id.trim()
    ) {
      return res.status(400).json({ error: "Missing required fields." });
    }    

    try {
      const result = await pool.query(
        `UPDATE "Announcements"
         SET title = $1,
             content = $2,
             category_id = $3,
             date_updated = CURRENT_DATE
         WHERE announcement_id = $4`,
        [title, content, category_id, announcement_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Announcement not found." });
      }

      res.status(200).json({ message: "Announcement updated successfully." });
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  });
});

exports.archiveAnnouncement = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).send("Method Not Allowed");
    }

    const { announcement_id, status } = req.body;

    // Validate input
    if (!announcement_id || status !== "Archived") {
      return res.status(400).json({ error: "Missing or invalid fields." });
    }

    try {
      // Update the announcement status in the database
      await pool.query(
        `UPDATE "Announcements" SET status = $1, date_updated = CURRENT_DATE WHERE announcement_id = $2`,
        [status, announcement_id]
      );

      res.status(200).json({ message: "Announcement archived successfully." });
    } catch (err) {
      console.error("Error archiving announcement:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  });
});
