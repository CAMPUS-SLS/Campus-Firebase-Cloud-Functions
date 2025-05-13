// functions/src/triggers/http/submitDocumentRequest.js

const { Client }      = require('pg');
const functions        = require('firebase-functions');
const cors             = require('cors')({ origin: true });

exports.submitDocumentRequest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 1️⃣ Pull form fields (now including userId)
    const {
      documentType,
      lastName,
      fullName,
      batch,
      collegeDepartment,  // college_id
      program,            // department_id
      message,            // purpose
      userId              // <— logged-in user's ID
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

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
      // 3️⃣ Generate next DR### ID
      const lastRow = await db.query(`
        SELECT doc_request_id
          FROM "Document_Requests"
         WHERE doc_request_id LIKE 'DR%'
         ORDER BY doc_request_id DESC
         LIMIT 1
      `);
      const lastId  = lastRow.rows[0]?.doc_request_id || 'DR000';
      const nextNum = parseInt(lastId.slice(2), 10) + 1;
      const newId   = 'DR' + String(nextNum).padStart(3, '0');

      // 4️⃣ Defaults
      const request_type = 'Document';
      const is_shs       = false;
      const status       = 'Pending';
      const admin_notes  = null;
      const created_at   = new Date().toISOString().split('T')[0];

      // 5️⃣ Insert into your 14-column table
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
           batch
         ) VALUES (
           $1,$2,$3,$4,
           $5,$6,$7,$8,
           $9,$10,$11,$12,
           $13,$14
         )`,
        [
          newId,               // $1 doc_request_id
          userId,              // $2 user_id
          request_type,        // $3
          documentType,        // $4
          lastName,            // $5
          fullName,            // $6
          collegeDepartment,   // $7
          is_shs,              // $8
          program,             // $9
          message,             // $10
          status,              // $11
          admin_notes,         // $12
          created_at,          // $13
          batch,               // $14
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
