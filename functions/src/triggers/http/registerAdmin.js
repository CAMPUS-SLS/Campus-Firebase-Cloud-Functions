const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

if (!admin.apps.length) {
  admin.initializeApp();
}

const pool = new Pool({
    user: "neondb_owner",
    host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
    database: "neondb",
    password: "npg_mQOGqHwl95Cd",
    port: 5432,
    ssl: { rejectUnauthorized: false },
});

exports.registerAdmin = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  
      try {
        console.log("🔧 Starting registerAdmin function");
  
        const {
          email, password, first_name, last_name, middle_name, auxillary_name,
          birth_date, gender, nationality, legal_status, religion, working_status,
          employer, acr_no, contact_no, income_status, photo_url
        } = req.body;
  
        console.log("📦 Received data:", req.body);
  
        const userRecord = await admin.auth().createUser({ email, password });
        const user_id = userRecord.uid;
        console.log("✅ Firebase user created:", user_id);
  
        const user_profile_id = "up_" + user_id.substring(0, 8);
        const role_id = "ROLE03";
        const department_id = "DEP002";
  
        const result = await pool.query(`SELECT admin_id FROM "Admin" ORDER BY admin_id DESC LIMIT 1`);
        let nextAdminId = "A001";
        if (result.rows.length > 0) {
          const lastId = result.rows[0].admin_id;
          const numeric = parseInt(lastId.replace("A", ""), 10) + 1;
          nextAdminId = "A" + numeric.toString().padStart(3, "0");
        }
        console.log("🆔 Next admin_id:", nextAdminId);
  
        await pool.query(
          `INSERT INTO "User" (user_id, role_id, email, photo_url, is_verified_admin_prof)
           VALUES ($1, $2, $3, $4, $5)`,
          [user_id, role_id, email, photo_url, true]
        );
        console.log("✅ Inserted into User");
  
        await pool.query(
          `INSERT INTO "User_Profile" (
            user_profile_id, user_id, first_name, middle_name, last_name,
            auxillary_name, birth_date, gender, nationality, legal_status,
            religion, working_status, employer, acr_no, contact_no,
            income_status, address_id
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15,
            $16, NULL
          )`,
          [
            user_profile_id, user_id, first_name, middle_name, last_name,
            auxillary_name || null, birth_date, gender, nationality, legal_status,
            religion, working_status, employer || null, acr_no || null, contact_no || null,
            income_status || null
          ]
        );
        console.log("✅ Inserted into User_Profile");
  
        await pool.query(
          `INSERT INTO "Admin" (admin_id, user_id, department_id)
           VALUES ($1, $2, $3)`,
          [nextAdminId, user_id, department_id]
        );
        console.log("✅ Inserted into Admin");
  
        res.status(200).send({ message: "Admin registered successfully!" });
  
      } catch (error) {
        console.error("❌ Registration failed:", error);
        res.status(500).send({ error: "Registration failed", details: error.message });
      }
    });
  });
  