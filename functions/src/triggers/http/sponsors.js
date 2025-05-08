const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

// PostgreSQL config
const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_mQOGqHwl95Cd',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// ✅ GET Sponsors and Perks
exports.getSponsors = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT s.sponsor_id, s.name, sp.perk, sp.sponsor_perks_id
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

// ✅ POST New Sponsor
exports.addSponsor = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { name, perks } = req.body;

    try {
      const sponsorResult = await pool.query(`SELECT nextval('sponsor_id_seq')`);
      const sponsor_id = `SP${sponsorResult.rows[0].nextval.toString().padStart(3, '0')}`;

      await pool.query(
        `INSERT INTO "Sponsors" (sponsor_id, name) VALUES ($1, $2)`,
        [sponsor_id, name]
      );

      for (const perk of perks) {
        const perkResult = await pool.query(`SELECT nextval('sponsor_perks_id_seq')`);
        const perk_id = `PERK${perkResult.rows[0].nextval.toString().padStart(3, '0')}`;

        await pool.query(
          `INSERT INTO "Sponsor_Perks" (sponsor_perks_id, perk, sponsor_id) VALUES ($1, $2, $3)`,
          [perk_id, perk, sponsor_id]
        );
      }

      return res.status(201).json({
        message: "Sponsor and perks added successfully",
        sponsor_id,
      });
    } catch (err) {
      console.error("Error adding sponsor:", err);
      return res.status(500).json({ error: err.message });
    }
  });
});

// ✅ PUT Update Sponsor
exports.updateSponsor = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "PUT") {
      return res.status(405).send("Method Not Allowed");
    }

    const sponsorId = req.query.id;
    const { name, perks } = req.body;

    if (!sponsorId || !name || !Array.isArray(perks)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      await pool.query(
        `UPDATE "Sponsors" SET name = $1 WHERE sponsor_id = $2`,
        [name, sponsorId]
      );

      await pool.query(
        `DELETE FROM "Sponsor_Perks" WHERE sponsor_id = $1`,
        [sponsorId]
      );

      for (const perk of perks) {
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

exports.deleteSponsor = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
      if (req.method !== "DELETE") {
        return res.status(405).send("Method Not Allowed");
      }
  
      const sponsorId = req.query.id;
      if (!sponsorId) {
        return res.status(400).json({ error: "Missing sponsor ID" });
      }
  
      try {
        // Delete related perks first
        await pool.query(`DELETE FROM "Sponsor_Perks" WHERE sponsor_id = $1`, [sponsorId]);
  
        // Then delete the sponsor
        await pool.query(`DELETE FROM "Sponsors" WHERE sponsor_id = $1`, [sponsorId]);
  
        return res.status(200).json({ message: "Sponsor deleted successfully." });
      } catch (err) {
        console.error("Error deleting sponsor:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  });
  
