// functions/manageAlumniCardApplication.js

const functions = require("firebase-functions");
const cors      = require("cors")({ origin: true });
const admin     = require("firebase-admin");
const { Client } = require("pg");
const { v4: uuidv4 } = require("uuid");

if (!admin.apps.length) admin.initializeApp();

const PG_CONFIG = {
  user:     "neondb_owner",
  host:     "ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech",
  database: "neondb",
  password: "npg_mQOGqHwl95Cd",
  port:     5432,
  ssl:      { rejectUnauthorized: false },
};

exports.manageAlumniCardApplication = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // --- auth ---
    const header = req.headers.authorization || "";
    const match  = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ error: "Missing auth header" });

    let uid;
    try {
      ({ uid } = await admin.auth().verifyIdToken(match[1]));
    } catch (err) {
      console.error("Token verification failed:", err);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const db = new Client(PG_CONFIG);
    await db.connect();

    // --- GET: fetch this user's application(s) ---
    if (req.method === "GET") {
      try {
        const q = `
          SELECT
            alumni_card_application_id    AS "applicationId",
            application_type              AS "applicationType",
            status,
            valid_id_front                AS "validIdFront",
            valid_id_back                 AS "validIdBack",
            graduation_photo              AS "graduationPhoto",
            delivery_type                 AS "deliveryType",
            TO_CHAR(process_date,'YYYY-MM-DD') AS "processDate",
            admin_notes                   AS "adminNotes"
          FROM public."Alumni_Card_Application"
          WHERE user_id = $1
          ORDER BY process_date DESC
          LIMIT 1;
        `;
        const { rows } = await db.query(q, [uid]);
        if (rows.length === 0) {
          return res.status(200).json({ application: null });
        }
        return res.status(200).json({ application: rows[0] });
      } catch (err) {
        console.error("GET error:", err);
        return res.status(500).json({ error: "Internal server error" });
      } finally {
        await db.end();
      }
    }

    // --- POST: create a new application ---
    if (req.method === "POST") {
      const {
        applicationType,
        validIdFront,
        validIdBack,
        graduationPhoto,
        deliveryType,
        processDate,   // expected YYYY-MM-DD or omitted
      } = req.body;

      if (
        !applicationType ||
        !validIdFront     ||
        !validIdBack      ||
        !graduationPhoto ||
        !deliveryType
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id      = uuidv4();
      const status  = "Pending";
      const notes   = null;

      try {
        const insert = `
          INSERT INTO public."Alumni_Card_Application"(
            alumni_card_application_id,
            user_id,
            application_type,
            status,
            valid_id_front,
            valid_id_back,
            graduation_photo,
            delivery_type,
            process_date,
            admin_notes
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          RETURNING
            alumni_card_application_id   AS "applicationId",
            application_type             AS "applicationType",
            status,
            valid_id_front               AS "validIdFront",
            valid_id_back                AS "validIdBack",
            graduation_photo             AS "graduationPhoto",
            delivery_type                AS "deliveryType",
            TO_CHAR(process_date,'YYYY-MM-DD') AS "processDate",
            admin_notes                  AS "adminNotes";
        `;
        const vals = [
          id,
          uid,
          applicationType,
          status,
          validIdFront,
          validIdBack,
          graduationPhoto,
          deliveryType,
          processDate || null,
          notes,
        ];
        const { rows } = await db.query(insert, vals);
        return res.status(201).json({ application: rows[0] });
      } catch (err) {
        console.error("POST error:", err);
        return res.status(500).json({ error: "Internal server error" });
      } finally {
        await db.end();
      }
    }

    // --- Method Not Allowed ---
    return res.status(405).json({ error: "Method Not Allowed" });
  });
});
