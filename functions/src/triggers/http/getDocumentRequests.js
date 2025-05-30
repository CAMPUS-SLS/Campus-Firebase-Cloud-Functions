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

exports.newgetDocumentRequests = functions.https.onRequest((req, res) => {
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
            ap."description",
            ap."amount",
            ap."payment_date",
            ap."reference_no",
            ap."remarks"
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
          paymentMode: row.description || "N/A",
          amountPaid: row.amount !== null ? row.amount : "N/A",
          paymentDate: row.payment_date || "N/A",
          referenceNumber: row.reference_no || "N/A",
          remarks: row.remarks || "N/A"
        }));

        res.status(200).json(requests);
      } catch (error) {
        console.error("❌ Error in getDocumentRequests:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
      }
    });
  });

  exports.newgetDocumentRequestDetail = functions.https.onRequest((req, res) => {
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
            ap."description",
            ap."amount",
            ap."payment_date",
            ap."reference_no",
            ap."type" AS payment_type,
            ap."remarks"
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
          paymentMode: row.description || "N/A",
          amountPaid: row.amount !== null ? row.amount : "N/A",
          paymentDate: row.payment_date || "N/A",
          referenceNumber: row.reference_no || "N/A",
          type: row.payment_type || "N/A",
          remarks: row.remarks || "N/A"
        });
      } catch (error) {
        console.error("❌ Error in getDocumentRequestDetail:", error.message);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
      }
    });
  });
