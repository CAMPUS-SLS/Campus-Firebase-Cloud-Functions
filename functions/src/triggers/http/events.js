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

// ✅ PUT Event - Update an existing event
exports.updateAlumniEvents = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const eventId = req.query.id;
    const { title , description, startDate, endDate, startTime, endTime, location, status } = req.body;

    if (!eventId || !title || !description || !startDate || !endDate || !startTime || !endTime || !location || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Update the event
      await pool.query(
        `UPDATE "Events" 
         SET event_name = $1, event_desc = $2, start_date =$3, end_date = $4, start_time = $5, end_time = $6, venue = $7, event_status = $8 
         WHERE event_id = $9`,
        [title, description, startDate, endDate, startTime, endTime, location, status, eventId]
      );

      return res.status(200).json({ 
        message: "Event updated successfully" 
      });
    } catch (err) {
      console.error("Error updating event:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});


exports.createEvents = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { title , description, startDate, endDate, startTime, endTime, location, status } = req.body;
    if (!title || !description || !startDate || !endDate || !startTime || !endTime || !location || !status) {
      return res.status(400).send("Missing required fields.");
    }

    try {
      // 1. Get the latest event_id
      const result = await pool.query(
        `SELECT event_id FROM "Events" ORDER BY event_id DESC LIMIT 1`
      );

      let newId;
      if (result.rows.length === 0) {
        newId = "EVNT001";
      } else {
        const lastId = result.rows[0].event_id; // e.g. 'ANN004'
        const numeric = parseInt(lastId.replace("EVNT", ""), 10) + 1;
        newId = `EVNT${numeric.toString().padStart(3, "0")}`;
      }

      // 2. Insert new row
      const insert = await pool.query(
        `INSERT INTO "Events" 
          (event_id, user_id, event_name, event_desc, start_date, end_date, start_time, end_time, venue, event_status, event_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Alumni')
          RETURNING *`,
                [newId, 'U005', title, description, startDate, endDate, startTime, endTime, location, status]
              );      

      res.status(201).json(insert.rows[0]);
    } catch (err) {
      console.error("❌ Error creating event:", err);
      res.status(500).send("Internal server error");
    }
  });
});