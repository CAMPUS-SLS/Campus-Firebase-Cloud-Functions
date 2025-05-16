// functions/src/triggers/http/getSponsorPerks.js

const functions  = require('firebase-functions');
const cors       = require('cors')({ origin: true });
const { Client } = require('pg');

exports.getSponsorPerks = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
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
      // Join Sponsor_Perks to Sponsors and select the photo_url
      const { rows } = await db.query(`
        SELECT
          sp.sponsor_perks_id   AS id,
          sp.perk               AS perk,
          sp.sponsor_id         AS sponsorId,
          s.photo_url           AS imageKey
        FROM public."Sponsor_Perks" AS sp
        JOIN public."Sponsors"      AS s
          ON sp.sponsor_id = s.sponsor_id
        ORDER BY sp.sponsor_id ASC;
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
