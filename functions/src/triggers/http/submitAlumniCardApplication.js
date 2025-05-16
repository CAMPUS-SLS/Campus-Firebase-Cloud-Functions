const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Client } = require("pg");
const cors = require("cors")({ origin: true });
const { v4: uuidv4 } = require("uuid");

if (!admin.apps.length) admin.initializeApp();

exports.submitAlumniCardApplication = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const token = req.headers.authorization?.split("Bearer ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    let uid;
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      uid = decoded.uid;
    } catch (err) {
      console.error("Auth error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }

    const {
      alumniName,
      initial,
      cardName,
      birthDate,
      type,
      batch,
      program,
      email,
      contactNo,
      address,
      postalCode,
      country,
      province,
      city,
      barangay,
      zone,
      deliveryType,
      processDate,
      validIdFrontUrl,
      validIdBackUrl,
      graduationPhotoUrl,
    } = req.body;

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

      // Get latest ACA id
      const { rows } = await db.query(`
        SELECT alumni_card_application_id
        FROM "Alumni_Card_Application"
        ORDER BY alumni_card_application_id DESC
        LIMIT 1
      `);

      let nextId = "ACA001";
      if (rows.length > 0) {
        const lastNum = parseInt(rows[0].alumni_card_application_id.replace("ACA", ""));
        nextId = `ACA${String(lastNum + 1).padStart(3, "0")}`;
      }

      await db.query(
        `
        INSERT INTO "Alumni_Card_Application" (
          alumni_card_application_id,
          user_id,
          application_type,
          status,
          valid_id_front,
          valid_id_back,
          graduation_photo,
          delivery_type,
          process_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          nextId,
          uid,
          "New",
          "Pending",
          validIdFrontUrl,
          validIdBackUrl,
          graduationPhotoUrl,
          deliveryType,
          processDate || new Date(),
        ]
      );

      return res.status(200).json({ message: "Application submitted", applicationId: nextId });
    } catch (err) {
      console.error("DB insert error:", err);
      return res.status(500).json({ error: "Failed to submit application" });
    } finally {
      await db.end();
    }
  });
});
