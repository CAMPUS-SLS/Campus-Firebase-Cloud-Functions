// functions/updateAlumniProfile.js

const functions = require("firebase-functions");
const cors      = require("cors")({ origin: true });
const admin     = require("firebase-admin");
const { Client } = require("pg");

if (!admin.apps.length) admin.initializeApp();

exports.updateAlumniProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only GET & POST
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Extract & verify Firebase ID token
    const header = req.headers.authorization || "";
    const match  = header.match(/^Bearer (.+)$/);
    if (!match) {
      return res.status(401).json({ error: "Missing auth header" });
    }
    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(match[1]);
      uid = decoded.uid;
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Connect to Neon Postgres
    const db = new Client({
      user:     "neondb_owner",
      host:     "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
      database: "neondb",
      password: "npg_mQOGqHwl95Cd",
      port:     5432,
      ssl:      { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      // --- GET: Return both read-only and editable fields (including photoUrl) ---
      if (req.method === "GET") {
        const selectSql = `
          SELECT
            ap.student_number       AS "studentNumber",
            up.first_name           AS "firstName",
            up.middle_name          AS "middleName",
            up.last_name            AS "lastName",
            up.gender               AS "gender",
            ap.photo_url            AS "photoUrl",
            ap.mobile_no            AS "mobileNo",
            ap.telephone_no         AS "telephoneNo",
            ap.alt_email            AS "altEmail",
            ap.facebook_id          AS "facebookId",
            ap.linkedin_url         AS "linkedinUrl",
            TO_CHAR(ap.last_updated,'YYYY-MM-DD') AS "lastUpdated"
          FROM public."Alumni_Profiles" ap
          JOIN public."User_Profile"   up ON up.user_id = ap.user_id
          WHERE ap.user_id = $1
          LIMIT 1;
        `;
        const { rows } = await db.query(selectSql, [uid]);
        if (rows.length === 0) {
          return res.status(404).json({ error: "Profile not found" });
        }
        return res.status(200).json(rows[0]);
      }

      // --- POST: Update editable fields + photo_url ---
      const {
        mobileNo,
        telNo,
        altEmail,
        facebookId,
        linkedinId,
        photo_url,    // from your front-end’s FormData → JSON payload
      } = req.body;

      // Must have at least one field to update
      if (
        mobileNo    === undefined &&
        telNo       === undefined &&
        altEmail    === undefined &&
        facebookId  === undefined &&
        linkedinId  === undefined &&
        photo_url   === undefined
      ) {
        return res.status(400).json({ error: "No fields to update" });
      }

      await db.query("BEGIN");

      const updateSql = `
        UPDATE public."Alumni_Profiles"
        SET
          mobile_no    = COALESCE($1, mobile_no),
          telephone_no = COALESCE($2, telephone_no),
          alt_email    = COALESCE($3, alt_email),
          facebook_id  = COALESCE($4, facebook_id),
          linkedin_url = COALESCE($5, linkedin_url),
          photo_url    = COALESCE($6, photo_url),
          last_updated = CURRENT_DATE
        WHERE user_id = $7
        RETURNING
          mobile_no    AS "mobileNo",
          telephone_no AS "telephoneNo",
          alt_email    AS "altEmail",
          facebook_id  AS "facebookId",
          linkedin_url AS "linkedinUrl",
          photo_url    AS "photoUrl",
          TO_CHAR(last_updated,'YYYY-MM-DD') AS "lastUpdated";
      `;
      const vals = [
        mobileNo,
        telNo,
        altEmail,
        facebookId,
        linkedinId,
        photo_url,
        uid,
      ];
      const { rows, rowCount } = await db.query(updateSql, vals);
      if (rowCount === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: "Profile not found" });
      }
      await db.query("COMMIT");
      return res.status(200).json(rows[0]);

    } catch (err) {
      console.error("DB error:", err);
      try { await db.query("ROLLBACK"); } catch (_) {}
      return res.status(500).json({ error: "Internal server error" });
    } finally {
      await db.end();
    }
  });
});
