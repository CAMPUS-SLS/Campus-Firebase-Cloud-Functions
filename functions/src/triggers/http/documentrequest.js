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

// ✅ GET: Fetch all document requests with complete info
exports.getDocumentRequests = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const result = await pool.query(`
        SELECT 
          dr."doc_request_id",
          dr."document_type",
          dr."status",
          dr."created_at",
          dr."batch",
          dr."purpose",
          up."first_name",
          up."last_name",
          up."contact_no",
          u."email",
          d."department_name",
          d."program_desc",
          ap."payment_method",
          ap."amount_paid",
          ap."payment_date",
          ap."reference_no"
        FROM "Document_Requests" dr
        JOIN "User" u ON dr."user_id" = u."user_id"
        JOIN "User_Profile" up ON u."user_id" = up."user_id"
        JOIN "Department" d ON dr."department_id" = d."department_id"
        LEFT JOIN "Alumni_Payment" ap 
          ON ap."user_id" = u."user_id"
          AND ap."type" = 'Document Request'
      `);

      const requests = result.rows.map((row, index) => ({
        id: `${row.doc_request_id}-${index}`,
        doc_request_id: row.doc_request_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        contactNum: row.contact_no,
        batch: row.batch,
        reason: row.purpose,
        documentType: row.document_type,
        requestDate: row.created_at,
        status: row.status,
        collegeDept: row.department_name,
        program: row.program_desc,
        paymentMode: row.payment_method,
        amountPaid: row.amount_paid,
        paymentDate: row.payment_date,
        referenceNumber: row.reference_no
      }));

      res.status(200).json(requests);
    } catch (error) {
      console.error("❌ Error in getDocumentRequests:", error.message);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });
});

// ✅ POST: Delete selected document requests
exports.deleteDocumentRequests = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No document request IDs provided" });
    }

    try {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
      const query = `DELETE FROM "Document_Requests" WHERE "doc_request_id" IN (${placeholders})`;

      await pool.query(query, ids);

      res.status(200).json({ message: "Document requests deleted successfully" });
    } catch (error) {
      console.error("❌ Error in deleteDocumentRequests:", error.message);
      res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
  });
});

// ✅ POST: Update status only (admin_notes excluded)
exports.updateDocumentRequestStatus = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }

    const { doc_request_id, new_status, comments } = req.body;

    if (!doc_request_id || !new_status) {
      return res.status(400).json({ message: "Missing doc_request_id or new_status" });
    }

    try {
      await pool.query(
        `UPDATE "Document_Requests"
         SET "status" = $1, "admin_comments" = $2
         WHERE "doc_request_id" = $3`,
        [new_status, comments, doc_request_id]
      );

      res.status(200).json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("❌ Error in updateDocumentRequestStatus:", error.message);
      res.status(500).json({ message: "Internal Server Error", details: error.message });
    }
  });
});

// ✅ GET: Fetch a single document request by ID with "Document Request" payment only
exports.getDocumentRequestDetail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { doc_request_id } = req.query;

    if (!doc_request_id) {
      return res.status(400).json({ message: "Missing doc_request_id" });
    }

    try {
      const result = await pool.query(`
        SELECT 
          dr."doc_request_id",
          dr."document_type",
          dr."status",
          dr."created_at",
          dr."batch",
          dr."purpose",
          up."first_name",
          up."last_name",
          up."contact_no",
          u."email",
          d."department_name",
          d."program_desc",
          ap."payment_method",
          ap."amount_paid",
          ap."payment_date",
          ap."reference_no",
          ap."type" AS payment_type
        FROM "Document_Requests" dr
        JOIN "User" u ON dr."user_id" = u."user_id"
        JOIN "User_Profile" up ON u."user_id" = up."user_id"
        JOIN "Department" d ON dr."department_id" = d."department_id"
        LEFT JOIN "Alumni_Payment" ap 
          ON dr."payment_id" = ap."payment_id"
        WHERE dr."doc_request_id" = $1
        LIMIT 1
      `, [doc_request_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Document request not found" });
      }

      const row = result.rows[0];

      res.status(200).json({
        id: row.doc_request_id,
        doc_request_id: row.doc_request_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        contactNum: row.contact_no,
        batch: row.batch,
        reason: row.purpose,
        documentType: row.document_type,
        requestDate: row.created_at ? new Date(row.created_at).toISOString() : null,
        status: row.status,
        collegeDept: row.department_name,
        program: row.program_desc,
        paymentMode: row.payment_method || "N/A",
        amountPaid: row.amount_paid !== null ? row.amount_paid : "N/A",
        paymentDate: row.payment_date || "N/A",
        referenceNumber: row.reference_no || "N/A",
        type: row.payment_type || "N/A"
      });
    } catch (error) {
      console.error("❌ Error in getDocumentRequestDetail:", error.message);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  });
});

