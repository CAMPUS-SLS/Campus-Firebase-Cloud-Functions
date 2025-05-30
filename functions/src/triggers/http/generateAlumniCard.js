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

exports.generateAlumniCard = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
      }
  
      const { user_id } = req.body;
      console.log("🟡 Incoming Request Body:", req.body);
  
      if (!user_id || typeof user_id !== "string") {
        return res.status(400).json({ message: "Invalid or missing user_id" });
      }
  
      try {
        // 🔍 Check if user exists
        const userCheck = await pool.query(
          `SELECT user_id FROM "User" WHERE user_id = $1`,
          [user_id]
        );
  
        if (userCheck.rows.length === 0) {
          console.warn("⚠️ User not found:", user_id);
          return res.status(404).json({ message: "User not found" });
        }
  
        // 🔄 Get latest alumni_card_id
        const result = await pool.query(`
          SELECT alumni_card_id FROM "Alumni_Card"
          ORDER BY alumni_card_id DESC
          LIMIT 1
        `);
  
        let nextId = "ALCA001";
        if (result.rows.length > 0) {
          const lastId = result.rows[0].alumni_card_id;
          const number = parseInt(lastId.replace("ALCA", ""), 10) + 1;
          nextId = "ALCA" + String(number).padStart(3, "0");
        }
  
        console.log("🟢 Inserting:", {
          alumni_card_id: nextId,
          user_id,
          is_valid: true,
        });
  
        console.log("🟡 Final insert values:", {
            alumni_card_id: nextId,
            user_id,
            date_created: new Date().toISOString(),
            is_valid: true
          });
        // ✅ Insert
        const insertResult = await pool.query(
            `INSERT INTO "Alumni_Card" (
               alumni_card_id,
               user_id,
               date_created,
               date_approved,
               valid_until,
               is_valid
             ) VALUES ($1, $2, now(), now(), (now() + interval '1 year')::date, TRUE)
             RETURNING *`,
            [nextId, user_id]
          );
  
        console.log("✅ Inserted:", insertResult.rows[0]);
  
        return res.status(200).json({
          message: "Alumni card generated successfully",
          data: insertResult.rows[0],
        });
      } catch (error) {
        console.error("🔥 Error generating alumni card:");
  console.error("Message:", error.message);
  if (error.stack) console.error("Stack:", error.stack);
  if (error.code) console.error("Code:", error.code);
  if (error.detail) console.error("Detail:", error.detail);
  return res.status(500).json({ message: error.message || "Internal server error" });
}
    });
  });  