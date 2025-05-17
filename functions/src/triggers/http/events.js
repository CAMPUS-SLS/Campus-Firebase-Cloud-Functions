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

// ✅ GET Events - Only name, description, and status
exports.getAlumniEvents = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT event_id, event_name AS "eventTitle", event_desc AS "eventDescription", event_status AS "eventStatus"
        FROM "Events" WHERE event_type = 'Alumni'
      `);

      const events = result.rows.map(row => ({
        id: row.event_id,
        name: row.eventTitle,
        description: row.eventDescription,
        status: row.eventStatus
      }));

      return res.status(200).json(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// ✅ POST Event - Create a new event
exports.addAlumniEvents = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
        if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
        }

    const { name, description, status } = req.body;

    if (!name || !description || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // GetAlum last event ID
      const result = await pool.query(
        `SELECT event_id FROM "Events"`
      );

      let newId;
      if (result.rows.length === 0) {
        newId = "EVNT001";
      } else {
        const lastId = result.rows[0].event_id; // e.g. 'EVNT004'
        const numeric = parseInt(lastId.replace("EVNT", ""), 10) + 1;
        newId = `EVNT${numeric.toString().padStart(3, "0")}`;
      }

      // Insert new event
      const insert = await pool.query(
        `INSERT INTO "Events" (event_id, event_name, event_desc, event_status, event_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [newId, name, description, status, 'Alumni']
      );

      res.status(201).json({
        message: "Event added successfully",
        event: insert.rows[0]
      });
    } catch (err) {
      console.error("❌ Error creating event:", err);
      res.status(500).send("Internal server error");
    }
  });
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

// ✅ DELETE Event - Delete an existing event
exports.deleteAlumniEvents = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const eventId = req.query.id;
    
    if (!eventId) {
      return res.status(400).json({ error: "Missing event ID" });
    }

    try {
      // Delete the event
      await pool.query(
        `DELETE FROM "Events" WHERE event_id = $1`, 
        [eventId]
      );

      return res.status(200).json({ 
        message: "Event deleted successfully" 
      });
    } catch (err) {
      console.error("Error deleting event:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});