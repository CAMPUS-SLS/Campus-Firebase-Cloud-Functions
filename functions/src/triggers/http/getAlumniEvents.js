const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Client } = require("pg");

const getAlumniEvents = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const db = new Client({
      user: "neondb_owner",
      host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
      database: "neondb",
      password: "npg_mQOGqHwl95Cd",
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      const { rows } = await db.query(`
        SELECT
        e.event_id,
        e.event_name AS "eventTitle",
        e.event_desc AS "eventDescription",
        TO_CHAR(e.start_date, 'MM/DD/YYYY') || ' to ' || TO_CHAR(e.end_date, 'MM/DD/YYYY') AS "eventDates",
        e.start_date AS "startDate",
        e.end_date AS "endDate",
        e.start_time AS "startTime",
        e.end_time AS "endTime",
        e.event_type AS "eventType",
        e.event_status AS "eventStatus",
        e.venue AS "eventVenue"
      FROM public."Events" e
      WHERE e.event_type = 'Alumni';

      `);
      return res.status(200).json(rows);
    } catch (err) { 
      console.error('Error fetching perks:', err);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await db.end();
    }
  });
});

module.exports = { getAlumniEvents };