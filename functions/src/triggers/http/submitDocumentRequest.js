const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();

exports.submitDocumentRequest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // ✅ 1. Verify auth token
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer (.+)$/);
    if (!match) return res.status(401).json({ message: 'Missing auth header' });

    const idToken = match[1];
    let userId;
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      userId = decoded.uid;
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // ✅ 2. Pull form fields
    const {
      documentType,
      lastName,
      fullName,
      batch,
      collegeDepartment,
      program,
      message
    } = req.body;

    // ✅ 3. Connect to Postgres
    const db = new Client({
      user: 'neondb_owner',
      host: 'ep-old-wind-a1kkjbku-pooler.ap-southeast-1.aws.neon.tech',
      database: 'neondb',
      password: 'npg_mQOGqHwl95Cd',
      port: 5432,
      ssl: { rejectUnauthorized: false },
    });

    await db.connect();

    try {
      // 4. Generate DR ID
      const lastRow = await db.query(`
        SELECT doc_request_id
        FROM "Document_Requests"
        WHERE doc_request_id LIKE 'DR%'
        ORDER BY doc_request_id DESC
        LIMIT 1
      `);
      const lastId = lastRow.rows[0]?.doc_request_id || 'DR000';
      const nextNum = parseInt(lastId.slice(2), 10) + 1;
      const newId = 'DR' + String(nextNum).padStart(3, '0');

      // 5. Defaults
      const request_type = 'Document';
      const is_shs = false;
      const status = 'Pending';
      const admin_notes = null;
      const created_at = new Date().toISOString().split('T')[0];

      // 6. Insert request
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
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14
        )`,
        [
          newId,
          userId,
          request_type,
          documentType,
          lastName,
          fullName,
          collegeDepartment,
          is_shs,
          program,
          message,
          status,
          admin_notes,
          created_at,
          batch,
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
