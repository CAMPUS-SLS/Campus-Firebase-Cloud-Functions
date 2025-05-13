// functions/src/triggers/http/getSidebarUser.js

const functions = require('firebase-functions');
const cors      = require('cors')({ origin: true });
const { Client } = require('pg');

exports.getSidebarUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

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
      const { rows } = await db.query(
        `
        SELECT
          r.role                                   AS role,
          u.email                                  AS email,
          CONCAT_WS(' ',
            COALESCE(up.first_name, ''),
            COALESCE(up.middle_name, ''),
            COALESCE(up.last_name, '')
          )                                         AS "fullName"
        FROM public."User"         AS u
        JOIN public."Role"         AS r ON u.role_id    = r.role_id
        JOIN public."User_Profile" AS up ON up.user_id   = u.user_id
        WHERE u.user_id = $1
        LIMIT 1;
        `,
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error('getSidebarUser error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      await db.end();
    }
  });
});
