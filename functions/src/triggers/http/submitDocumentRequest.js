// functions/src/triggers/http/submitDocumentRequest.js

const { Client }      = require('pg');
const functions        = require('firebase-functions');
const cors             = require('cors')({ origin: true });

exports.submitDocumentRequest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 1️⃣ Pull form fields:
    const {
      documentType,
      lastName,
      fullName,
      batch,              // free-text
      collegeDepartment,  // e.g. "College of Information and Computing Sciences"
      program,            // e.g. "Information Systems"
      message             // “Reason for Request”
    } = req.body;

    // 2️⃣ Connect to Postgres
    const db = new Client({
      user:     'neondb_owner',
      host:     'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
      database: 'neondb',
      password: 'npg_mQOGqHwl95Cd',
      port:     5432,
      ssl:      { rejectUnauthorized: false },
    });
    await db.connect();

    try {
      // 3️⃣ Look up college_id & department_id based on names
      const lookupRes = await db.query(
        `
          SELECT
            c.college_id,
            d.department_id
          FROM "College"    AS c
          JOIN "Department" AS d
            ON c.college_id = d.college_id
          WHERE c.college_name    = $1
            AND d.department_name ILIKE '%' || $2 || '%'
          LIMIT 1
        `,
        [ collegeDepartment, program ]
      );

      if (lookupRes.rowCount === 0) {
        return res.status(400).json({
          message: `Invalid college/department combination: ${collegeDepartment} / ${program}`
        });
      }

      const { college_id, department_id } = lookupRes.rows[0];

      // 4️⃣ Generate next DR### ID
      const { rows } = await db.query(`
        SELECT doc_request_id
          FROM "Document_Requests"
         WHERE doc_request_id LIKE 'DR%'
         ORDER BY doc_request_id DESC
         LIMIT 1
      `);
      const lastId  = rows[0]?.doc_request_id || 'DR000';
      const nextNum = parseInt(lastId.slice(2), 10) + 1;
      const newId   = 'DR' + String(nextNum).padStart(3, '0');

      // 5️⃣ Prepare defaults
      const request_type = 'Document';
      const is_shs       = false;            // adjust as needed
      const status       = 'Pending';
      const admin_notes  = null;
      const created_at   = new Date().toISOString().split('T')[0];

      // 6️⃣ Insert using the looked-up IDs
      await db.query(
        `INSERT INTO "Document_Requests" (
           doc_request_id,
           user_id,
           request_type,
           document_type,
           last_name,
           full_name,
           college_id,
           is_shs,
           department_id,
           purpose,
           status,
           admin_notes,
           created_at,
           batch,
           department,
           program
         ) VALUES (
           $1,$2,$3,$4,
           $5,$6,$7,$8,
           $9,$10,$11,$12,
           $13,$14,$15,$16
         )`,
        [
          newId,               // $1
          null,                // $2  (user_id)
          request_type,        // $3
          documentType,        // $4
          lastName,            // $5
          fullName,            // $6
          college_id,          // $7
          is_shs,              // $8
          department_id,       // $9
          message,             // $10
          status,              // $11
          admin_notes,         // $12
          created_at,          // $13
          batch,               // $14
          collegeDepartment,   // $15 store display name
          program              // $16 store display name
        ]
      );

      return res.status(200).json({ message: 'Document request submitted.' });
    } catch (err) {
      console.error('submitDocumentRequest error:', err);
      return res.status(500).json({ message: 'Server error: ' + err.message });
    } finally {
      await db.end();
    }
  });
});
