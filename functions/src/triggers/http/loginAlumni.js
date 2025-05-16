// functions/src/triggers/http/loginAlumni.js
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Client } = require("pg");
const admin = require("firebase-admin");

// ✅ Initialize Firebase Admin SDK
if (!admin.apps.length) admin.initializeApp();

exports.loginAlumni = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      console.warn("⚠️ Missing email or password in request");
      return res.status(400).json({ error: "Missing email or password" });
    }

    const db = new Client({
      user: "neondb_owner",
      host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
      database: "neondb",
      password: "npg_mQOGqHwl95Cd",
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();
      console.log("🟢 Connected to PostgreSQL");

      const query = `
        SELECT u.user_id, u.email, u.password, r.role,
               u.photo_url,
               ap.alumni_profile_id, ap.student_number,
               ap.department_id, ap.strand, ap.year_graduated
        FROM public."User" AS u
        JOIN public."Role" AS r ON u.role_id = r.role_id
        LEFT JOIN public."Alumni_Profiles" AS ap ON ap.user_id = u.user_id
        WHERE u.email = $1
        LIMIT 1;
      `;

      const { rows } = await db.query(query, [email]);
      await db.end();
      console.log("📦 Query result:", rows);

      if (!rows.length) {
        console.warn("❌ No user found for email:", email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = rows[0];

      if (user.password !== password) {
        console.warn("❌ Incorrect password for:", email);
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (user.role !== "Alumni") {
        console.warn("🚫 Not an alumni account:", email);
        return res.status(403).json({ error: "Access denied. Not an alumni account." });
      }

      if (!user.user_id || typeof user.user_id !== "string" || user.user_id.length < 10) {
        console.error("❌ Invalid or missing user_id:", user.user_id);
        return res.status(500).json({ error: "Invalid Firebase UID for token creation" });
      }

      // ✅ Create Firebase Custom Token
      let customToken;
      try {
        console.log("🔐 Creating Firebase token for UID:", user.user_id);
        customToken = await admin.auth().createCustomToken(user.user_id);
        console.log("✅ Token created for:", user.user_id);
      } catch (tokenErr) {
        console.error("🔥 Firebase token creation failed:", tokenErr.message || tokenErr);
        return res.status(500).json({ error: "Token generation failed" });
      }

      // ✅ Respond with token and profile data
      return res.json({
        customToken,
        user: {
          id: user.user_id,
          email: user.email,
          photoUrl: user.photo_url || null,
        },
        profile: {
          alumniProfileId: user.alumni_profile_id || null,
          studentNumber: user.student_number || null,
          departmentId: user.department_id || null,
          strand: user.strand || null,
          yearGraduated: user.year_graduated || null,
        },
      });
    } catch (err) {
      console.error("🔥 loginAlumni internal error:", err.stack || err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
});
