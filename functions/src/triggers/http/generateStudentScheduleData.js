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

// Function to generate a random hex color with medium brightness
const generateRandomColor = () => {
  const randomChannel = () => Math.floor(Math.random() * 156) + 50; // Ensures values between 50 and 205
  const r = randomChannel();
  const g = randomChannel();
  const b = randomChannel();
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`; // Convert to hex
};

exports.generateStudentScheduleData = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const query = `
      SELECT
        st.user_id,
        c.course_id AS subject_code,
        c.course_title AS subject_desc,
        c.lec_units,
        c.lab_units,
        s.section_desc AS section,
        t.weekday AS day,
        t.timeslot_start AS startTime,
        t.timeslot_end AS endTime,
        rm.floor_no || ' ' || rm.building AS location,
        rm.room_no AS room,
        CONCAT(up.last_name, ', ', up.first_name) AS instructor
      FROM
        "Course" c
      JOIN
        "Timeslot" t ON c.course_id = t.course_id
      JOIN
        "Section" s ON t.section_id = s.section_id
      JOIN
        "Room" rm ON t.room_id = rm.room_id
      JOIN
        "Professor" p ON t.professor_id = p.professor_id
      JOIN
        "User_Profile" up ON p.user_id = up.user_id
      JOIN
        "Student" st ON s.section_id = st.section_id
      JOIN
        "User" u ON st.user_id = u.user_id;
    `;

    const enrollmentQuery = `
    SELECT
        st.user_id,
        e.acad_year AS year,
        e.acad_term AS term
    FROM
        "Enrollment" e
    JOIN
        "Student" st ON e.student_id = st.student_id
    WHERE
        e.enrollment_status = 'Enrolled';
    `;

    try {
      const { rows } = await pool.query(query);
      const { acadyearterm } = await pool.query(enrollmentQuery);

      // Transform the data into the desired format
      const transformedData = rows.reduce((acc, row, index) => {
        // Helper function to convert time to 12-hour format with AM/PM
        const convertTo12HourFormat = (time) => {
          const [hours, minutes] = time.split(':');
          const date = new Date();
          date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
        };

        // Check if the subject already exists in the accumulator
        let subject = acc.find(item => item.subject_code === row.subject_code);

        if (!subject) {
          // Add a new subject entry
          subject = {
            subject_id: index + 1, // Auto-generate subject_id based on the index
            subject_code: row.subject_code,
            subject_desc: row.subject_desc,
            lec_units: row.lec_units,
            lab_units: row.lab_units,
            section: row.section,
            location: row.location,
            color: generateRandomColor(), // Generate a random hex color
            schedules: [],
          };
          acc.push(subject);
        }

        // Add the schedule entry
        subject.schedules.push({
          day: row.day,
          startTime: convertTo12HourFormat(row.startTime), // Convert startTime
          endTime: convertTo12HourFormat(row.endTime), // Convert endTime
          room: row.room,
          instructor: row.instructor,
        });

        return acc;
      }, []);

      return res.status(200).json(transformedData);
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});


/* 
    SELECT
    u.user_id,
    c.course_id AS subject_code,
    c.course_title AS subject_desc,
    c.lec_units,
    c.lab_units,
    s.section_desc AS section,
    t.weekday AS day,
    t.timeslot_start AS startTime,
    t.timeslot_end AS endTime,
    rm.floor_no || ' ' || rm.building AS location,
    rm.room_no AS room,
    CONCAT(up.last_name, ', ', up.first_name) AS instructor
    
    FROM
    "Course" c
    JOIN
    "Timeslot" t ON c.course_id = t.course_id
    JOIN
    "Section" s ON t.section_id = s.section_id
    JOIN
    "Room" rm ON t.room_id = rm.room_id
    JOIN
    "Professor" p ON t.professor_id = p.professor_id
    JOIN
    "User_Profile" up ON p.user_id = up.user_id
    JOIN 
    "Student" st ON s.section_id = st.section_id
    JOIN 
    "User" u ON st.user_id = u.user_id;
*/