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

exports.createTimeSlot = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { startTime, endTime, weekday, courseid, professorid, roomid, sectionid, isLab } = req.body;

    if (!startTime || !endTime || !weekday || !courseid || !professorid || !roomid || !sectionid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = "TS"+ Date.now()

    const sql = `
      INSERT INTO "Timeslot"(timeslot_id, timeslot_start, timeslot_end, weekday, professor_id, course_id, section_id, room_id, is_available, "isLab")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9) RETURNING *
    `;

    const values = [
      id,
      startTime,
      endTime,
      weekday,
      professorid,
      courseid,
      sectionid,
      roomid,
      isLab
    ];

    try {
      const result = await pool.query(sql, values);
      return res.status(201).json({ timeslot: result.rows[0] });
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/*
FRONTEND CODE SAMPLE

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/createTimeSlot", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    startTime: "10:00:00", //MUST BE IN 24 HOUR FORMAT
    endTime: "12:00:00",
    weekday: "Friday",  //MUST BE IN FULL FORMAT
    courseid: "COURSE001", //IT MUST BE IDs 
    professorid: "P001",
    roomid: "RM001",
    sectionid: "SEC001"
    isLab: false
  })
}).then(response => response.json())
.then(data => console.log("Inputted into Database:", data))
.catch(error => console.error("Error:", error));

*/