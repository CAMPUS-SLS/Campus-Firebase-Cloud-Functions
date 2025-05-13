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

// ✅ GET Sponsors and their perks
exports.getSponsors = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT s.sponsor_id, s.name, s.photo_url, sp.perk, sp.sponsor_perks_id
        FROM "Sponsors" s
        LEFT JOIN "Sponsor_Perks" sp ON s.sponsor_id = sp.sponsor_id
        ORDER BY s.sponsor_id
      `);

      const sponsorsMap = new Map();

      result.rows.forEach(row => {
        if (!sponsorsMap.has(row.sponsor_id)) {
          sponsorsMap.set(row.sponsor_id, {
            id: row.sponsor_id,
            name: row.name,
            photoUrl: row.photo_url,
            perks: [],
          });
        }

        if (row.perk) {
          sponsorsMap.get(row.sponsor_id).perks.push({
            id: row.sponsor_perks_id,
            perk: row.perk,
          });
        }
      });

      return res.status(200).json(Array.from(sponsorsMap.values()));
    } catch (err) {
      console.error("Error fetching sponsors:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// ✅ POST Sponsor with imageKey (string)
exports.addSponsor = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { name, perks, imageKey } = req.body;

    if (!name || !perks) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const sponsorResult = await pool.query(`SELECT nextval('sponsor_id_seq')`);
      const sponsor_id = `SP${sponsorResult.rows[0].nextval.toString().padStart(3, '0')}`;

      await pool.query(
        `INSERT INTO "Sponsors" (sponsor_id, name, photo_url) VALUES ($1, $2, $3)`,
        [sponsor_id, name, imageKey || null]
      );

      const parsedPerks = JSON.parse(perks);
      for (const perk of parsedPerks) {
        const perkResult = await pool.query(`SELECT nextval('sponsor_perks_id_seq')`);
        const perk_id = `PERK${perkResult.rows[0].nextval.toString().padStart(3, '0')}`;
        await pool.query(
          `INSERT INTO "Sponsor_Perks" (sponsor_perks_id, perk, sponsor_id) VALUES ($1, $2, $3)`,
          [perk_id, perk, sponsor_id]
        );
      }

      return res.status(201).json({ message: "Sponsor added", sponsor_id });
    } catch (err) {
      console.error("Error adding sponsor:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});

// ✅ PUT Sponsor with imageKey
exports.updateSponsor = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const sponsorId = req.query.id;
    const { name, perks, imageKey } = req.body;

    if (!sponsorId || !name || !perks) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      if (imageKey) {
        await pool.query(
          `UPDATE "Sponsors" SET name = $1, photo_url = $2 WHERE sponsor_id = $3`,
          [name, imageKey, sponsorId]
        );
      } else {
        await pool.query(
          `UPDATE "Sponsors" SET name = $1 WHERE sponsor_id = $2`,
          [name, sponsorId]
        );
      }

      await pool.query(`DELETE FROM "Sponsor_Perks" WHERE sponsor_id = $1`, [sponsorId]);

      const parsedPerks = JSON.parse(perks);
      for (const perk of parsedPerks) {
        const perk_id_result = await pool.query("SELECT nextval('sponsor_perks_id_seq')");
        const perk_id = `PERK${perk_id_result.rows[0].nextval.toString().padStart(3, '0')}`;
        await pool.query(
          `INSERT INTO "Sponsor_Perks" (sponsor_perks_id, perk, sponsor_id) VALUES ($1, $2, $3)`,
          [perk_id, perk.perk, sponsorId]
        );
      }

      return res.status(200).json({ message: "Sponsor updated successfully." });
    } catch (err) {
      console.error("Error updating sponsor:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});

// ✅ DELETE Sponsor
exports.deleteSponsor = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const sponsorId = req.query.id;
    if (!sponsorId) {
      return res.status(400).json({ error: "Missing sponsor ID" });
    }

    try {
      await pool.query(`DELETE FROM "Sponsor_Perks" WHERE sponsor_id = $1`, [sponsorId]);
      await pool.query(`DELETE FROM "Sponsors" WHERE sponsor_id = $1`, [sponsorId]);

      return res.status(200).json({ message: "Sponsor deleted successfully." });
    } catch (err) {
      console.error("Error deleting sponsor:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});
