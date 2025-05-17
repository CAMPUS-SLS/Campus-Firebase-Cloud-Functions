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

exports.verifyTimeAvailability = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { startTime, endTime, weekday, professorid, roomid, sectionid } = req.body;

    if (!startTime || !endTime || !weekday || !professorid || !roomid || !sectionid) {
      return res.status(400).json({ error: 'Missing values' });
    }

    const sqlTimeslotSearch = `
      SELECT * FROM "Timeslot" 
      WHERE (timeslot_start < $1 AND timeslot_end > $2) 
      AND weekday = $3 
      AND (room_id = $4 OR section_id = $5 OR professor_id =$6)
    `;

    const sqlRoomAvailabilitySearch = `
      SELECT * FROM "Room_Availability" 
      WHERE timeslot_start <= $1 AND timeslot_end >= $2 
      AND weekday = $3 AND room_id = $4;
    `;

    const sqlProfessorAvailability = `
      SELECT * FROM "Professor_Availability" 
      WHERE timeslot_start <= $1 AND timeslot_end >= $2 
      AND weekday = $3 AND professor_id = $4;
    `;

    try {
      const timeslotResult = await pool.query(sqlTimeslotSearch, [endTime, startTime, weekday, roomid, sectionid, professorid]);
      //const roomResult = await pool.query(sqlRoomAvailabilitySearch, [startTime, endTime, weekday, roomid]);
      //const professorResult = await pool.query(sqlProfessorAvailability, [startTime, endTime, weekday, professorid]);

      const emptyTimeslot = timeslotResult.rows.length === 0;
      //const roomOpen = roomResult.rows.length > 0;
      //const professorOpen = professorResult.rows.length > 0;

      return res.status(200).json({
        available: emptyTimeslot,
      });
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/*
FRONTEND CODE SAMPLE

fetch("https://asia-southeast1-campus-student-lifecycle.cloudfunctions.net/verifyTimeAvailability", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    startTime:"10:00:00",
    endTime: "12:00:00",
    weekday: "Friday", 
    professorid: "P001", 
    roomid:"RM001",
    sectionid:"SEC001",
  })
})
.then(response => response.json())
.then(data => console.log("Response:", data))
.catch(error => console.error("Error:", error));

*/