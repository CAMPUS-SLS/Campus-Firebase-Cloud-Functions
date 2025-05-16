const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const admin = require("firebase-admin");
const { Client } = require("pg");

if (!admin.apps.length) admin.initializeApp();

exports.getSidebarUser = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing auth header" });
    const idToken = match[1];

    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const uid = decoded.uid;

      // Connect to DB
      const db = new Client({
        user: "neondb_owner",
        host: "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
        database: "neondb",
        password: "npg_mQOGqHwl95Cd",
        port: 5432,
        ssl: { rejectUnauthorized: false },
      });

      await db.connect();

      const query = `
        SELECT 
          u.user_id,
          u.email,
          r.role,
          ap.photo_url,
          up.first_name,
          up.last_name
        FROM public."User" u
        JOIN public."Role" r ON u.role_id = r.role_id
        LEFT JOIN public."Alumni_Profiles" ap ON ap.user_id = u.user_id
        LEFT JOIN public."User_Profile" up ON up.user_id = u.user_id
        WHERE u.user_id = $1
        LIMIT 1;
      `;

      const { rows } = await db.query(query, [uid]);
      await db.end();

      if (!rows.length) return res.status(404).json({ error: "User not found" });

      const { user_id, email, role, photo_url, first_name, last_name } = rows[0];
      const fullName = [first_name, last_name].filter(Boolean).join(" ");

      return res.json({ user_id, email, role, photo_url, fullName });
    } catch (err) {
      console.error("🔥 Error in getSidebarUser:", err.stack || err);
      return res.status(401).json({ error: "Invalid token" });
    }
  });
});
