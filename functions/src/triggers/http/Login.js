const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

// ✅ Prevent double-initialization
if (!admin.apps.length) {
  admin.initializeApp();
}

// NeonDB pool
const pool = new Pool({
  user: "neondb_owner",
  host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
  database: "neondb",
  password: "npg_mQOGqHwl95Cd",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

exports.verifyAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];

    if (!idToken) return res.status(401).json({ error: "Missing auth token" });

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = decoded.email;

      const query = `SELECT * FROM "User" WHERE email = $1 AND role_id = 'ROLE03'`;
      const result = await pool.query(query, [email]);

      if (result.rows.length > 0) {
        return res.json({ isAdmin: true });
      } else {
        return res.status(403).json({ isAdmin: false });
      }
    } catch (err) {
      console.error("Error verifying admin:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });exports.getUserProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const email = decoded.email;

      // Step 1: Find user_id from User table
      const userResult = await pool.query(
        `SELECT user_id FROM "User" WHERE email = $1 LIMIT 1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userId = userResult.rows[0].user_id;

      // Step 2: Fetch full name from User_Profile
      const profileResult = await pool.query(
        `SELECT first_name, last_name FROM "User_Profile" WHERE user_id = $1 LIMIT 1`,
        [userId]
      );

      if (profileResult.rows.length === 0) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const { first_name, last_name } = profileResult.rows[0];
      const displayName = `${first_name} ${last_name}`;

      return res.json({ displayName });
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return res.status(500).json({ error: "Server error" });
    }
  });
});
});


exports.getUserProfile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      const idToken = req.headers.authorization?.split("Bearer ")[1];
      if (!idToken) return res.status(401).json({ error: "Missing token" });
  
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        const email = decoded.email;
  
        // Step 1: Find user_id from User table
        const userResult = await pool.query(
          `SELECT user_id FROM "User" WHERE email = $1 LIMIT 1`,
          [email]
        );
  
        if (userResult.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
  
        const userId = userResult.rows[0].user_id;
  
        // Step 2: Fetch full name from User_Profile
        const profileResult = await pool.query(
          `SELECT first_name, last_name FROM "User_Profile" WHERE user_id = $1 LIMIT 1`,
          [userId]
        );
  
        if (profileResult.rows.length === 0) {
          return res.status(404).json({ error: "Profile not found" });
        }
  
        const { first_name, last_name } = profileResult.rows[0];
        const displayName = `${first_name} ${last_name}`;
  
        return res.json({ displayName });
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return res.status(500).json({ error: "Server error" });
      }
    });
  });

  exports.getAdminProfile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      const userId = req.query.user_id;
  
      console.log("Received user_id:", userId); // ✅ Add this
  
      if (!userId) {
        console.warn("Missing user_id in request");
        return res.status(400).json({ error: "Missing user_id" });
      }
  
      try {
        const result = await pool.query(
          `SELECT 
          up.first_name, 
          up.middle_name, 
          up.last_name, 
          up.gender, 
          u.email, 
          u.photo_url
        FROM "User_Profile" up
        JOIN "User" u ON up.user_id = u.user_id
        WHERE up.user_id = $1`,
          [userId]
        );
  
        console.log("Query result:", result.rows); // ✅ Add this
  
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "User not found" });
        }
  
        return res.json(result.rows[0]);
      } catch (err) {
        console.error("🔥 Query error:", err); // ✅ Catch the exact error
        return res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  exports.updateAdminProfile = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" })
      }
  
      const {
        user_id,
        first_name,
        middle_name,
        last_name,
        gender,
        email,
        photo_url,
      } = req.body
  
      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id" })
      }
  
      try {
        // Update User_Profile
        await pool.query(
          `UPDATE "User_Profile"
           SET first_name = $1,
               middle_name = $2,
               last_name = $3,
               gender = $4
           WHERE user_id = $5`,
          [first_name, middle_name, last_name, gender, user_id]
        )
  
        // Update User table
        await pool.query(
          `UPDATE "User"
           SET email = $1,
               photo_url = $2
           WHERE user_id = $3`,
          [email, photo_url, user_id]
        )
  
        return res.json({ message: "Profile updated successfully" })
      } catch (err) {
        console.error("🔥 Update error:", err)
        return res.status(500).json({ error: "Internal server error" })
      }
    })
  })