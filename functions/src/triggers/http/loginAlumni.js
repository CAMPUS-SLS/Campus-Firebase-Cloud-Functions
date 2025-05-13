// functions/src/triggers/http/loginAlumni.js

const functions  = require('firebase-functions');
const cors       = require('cors')({ origin: true });
const { Client } = require('pg');

const loginAlumni = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Connect to Postgres
    const db = new Client({
      user:     'neondb_owner',
      host:     'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
      database: 'neondb',
      password: 'npg_mQOGqHwl95Cd',
      port:     5432,
      ssl:      { rejectUnauthorized: false },
    });
    await db.connect();

    try {
      // Look up user + role + alumni profile
      const { rows } = await db.query(
        `
        SELECT 
          u.user_id,
          u.email,
          u.password,
          u.photo_url,
          r.role,
          ap.alumni_profile_id,
          ap.student_number,
          ap.department_id,
          ap.strand,
          ap.year_graduated
        FROM public."User"    AS u
        JOIN public."Role"    AS r ON u.role_id = r.role_id
        LEFT JOIN public."Alumni_Profiles" AS ap
          ON ap.user_id = u.user_id
        WHERE u.email = $1
        LIMIT 1
        `,
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const user = rows[0];

      // Plain‐text password check; replace with hashed compare in prod
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.role !== 'Alumni') {
        return res.status(403).json({ error: 'Not an alumni account' });
      }

      // Build response object
      const resp = {
        user: {
          id:        user.user_id,
          email:     user.email,
          photoUrl:  user.photo_url,
        },
        profile: {
          alumniProfileId: user.alumni_profile_id,
          studentNumber:   user.student_number,
          departmentId:    user.department_id,
          strand:          user.strand,
          yearGraduated:   user.year_graduated,
        }
      };

      return res.status(200).json({ message: 'Login successful', ...resp });
    } catch (err) {
      console.error('loginAlumni error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await db.end();
    }
  });
});

module.exports = { loginAlumni };
