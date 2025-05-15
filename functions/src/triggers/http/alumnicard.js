const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { Pool } = require("pg");

console.log("🔥 Function file loaded");

const pool = new Pool({
  user: 'neondb_owner',
  host: 'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
  database: 'neondb',
  password: 'npg_mQOGqHwl95Cd',
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

// ✅ GET detail of one alumni card application
exports.getAlumniCardApplicationDetail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { alumni_card_application_id } = req.query;

    if (!alumni_card_application_id) {
      return res.status(400).json({ message: "Missing alumni_card_application_id" });
    }

    try {
      const result = await pool.query(`
        SELECT 
          aca."alumni_card_application_id",
          aca."application_type",
          aca."status",
          aca."delivery_type",
          aca."process_date",
          aca."valid_id_front",
          aca."valid_id_back",
          aca."graduation_photo",
          aca."admin_notes",
          u."user_id",
          u."email",
          up."first_name",
          up."middle_name",
          up."last_name",
          up."birth_date",
          up."gender",
          up."nationality",
          up."legal_status",
          up."religion",
          up."working_status",
          up."employer",
          up."acr_no",
          up."contact_no",
          up."income_status",
          up."address_id",
          ap."student_number",
          ap."birth_place",
          ap."civil_status",
          ap."mobile_no",
          ap."telephone_no",
          ap."alt_email",
          ap."department_id",
          ap."strand",
          ap."highest_degree",
          ap."year_graduated",
          ap."current_work",
          ap."linkedin_url",
          ap."facebook_id",
          ap."photo_url",
          ap."last_updated",
          addr."house_no",
          addr."street",
          addr."barangay",
          addr."city",
          addr."province",
          addr."postal_code",
          addr."country",
          pay."payment_method",
          pay."amount_paid",
          pay."payment_date",
          pay."reference_no",
          pay."type" AS payment_type
        FROM "Alumni_Card_Application" aca
        JOIN "User" u ON aca."user_id" = u."user_id"
        LEFT JOIN "User_Profile" up ON u."user_id" = up."user_id"
        LEFT JOIN "Alumni_Profiles" ap ON u."user_id" = ap."user_id"
        LEFT JOIN "Address" addr ON up."address_id" = addr."address_id"
        LEFT JOIN "Alumni_Payment" pay ON aca."payment_id" = pay."payment_id"
        WHERE aca."alumni_card_application_id" = $1
        LIMIT 1;
      `, [alumni_card_application_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Application not found" });
      }

      const row = result.rows[0];

      res.status(200).json({
        alumni_card_application_id: row.alumni_card_application_id,
        application_type: row.application_type,
        status: row.status,
        delivery_type: row.delivery_type,
        process_date: row.process_date,
        valid_id_front: row.valid_id_front,
        valid_id_back: row.valid_id_back,
        graduation_photo: row.graduation_photo,
        admin_notes: row.admin_notes,
        user_id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        middle_name: row.middle_name,
        last_name: row.last_name,
        birth_date: row.birth_date,
        gender: row.gender,
        nationality: row.nationality,
        legal_status: row.legal_status,
        religion: row.religion,
        working_status: row.working_status,
        employer: row.employer,
        acr_no: row.acr_no,
        contact_no: row.contact_no,
        income_status: row.income_status,
        student_number: row.student_number,
        birth_place: row.birth_place,
        civil_status: row.civil_status,
        mobile_no: row.mobile_no,
        telephone_no: row.telephone_no,
        alt_email: row.alt_email,
        department_id: row.department_id,
        strand: row.strand,
        highest_degree: row.highest_degree,
        year_graduated: row.year_graduated,
        current_work: row.current_work,
        linkedin_url: row.linkedin_url,
        facebook_id: row.facebook_id,
        photo_url: row.photo_url,
        last_updated: row.last_updated,
        house_no: row.house_no,
        street: row.street,
        barangay: row.barangay,
        city: row.city,
        province: row.province,
        postal_code: row.postal_code,
        country: row.country,
        paymentMode: row.payment_method || "N/A",
        amountPaid: row.amount_paid !== null ? row.amount_paid : "N/A",
        paymentDate: row.payment_date || "N/A",
        referenceNumber: row.reference_no || "N/A",
        type: row.payment_type || "N/A"
      });
    } catch (error) {
      console.error("❌ Error in getAlumniCardApplicationDetail:", error.message);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });
});

// ✅ Update status
exports.updateAlumniCardStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { alumni_card_application_id, status } = req.body;

    if (!alumni_card_application_id || !status) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    try {
      await pool.query(
        `UPDATE "Alumni_Card_Application"
         SET status = $1
         WHERE alumni_card_application_id = $2`,
        [status, alumni_card_application_id]
      );

      res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
});

// ✅ Save test photo URL
exports.saveTestPhotoUrl = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { user_id, photo_url } = req.body;

    if (!user_id || !photo_url) {
      return res.status(400).send("Missing user_id or photo_url.");
    }

    try {
      await pool.query(
        `UPDATE "User"
         SET photo_url = $1
         WHERE user_id = $2`,
        [photo_url, user_id]
      );

      res.status(200).send("Photo URL updated successfully.");
    } catch (err) {
      console.error("Error updating photo_url:", err);
      res.status(500).send("Database error.");
    }
  });
});

// ✅ DELETE multiple alumni card applications
exports.deleteAlumniCardApplications = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No application IDs provided" });
    }

    try {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
      await pool.query(
        `DELETE FROM "Alumni_Card_Application"
         WHERE "alumni_card_application_id" IN (${placeholders})`,
        ids
      );

      res.status(200).json({ message: "Alumni card applications deleted successfully" });
    } catch (error) {
      console.error("❌ Error deleting applications:", error.message);
      res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
  });
});
