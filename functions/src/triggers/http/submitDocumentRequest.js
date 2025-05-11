// functions/src/triggers/http/submitDocumentRequest.js

const { Client }      = require('pg');
const functions        = require('firebase-functions');
const cors             = require('cors')({ origin: true });

// Map full college name → college_id code  (we’ll still honor college mapping)
const COLLEGE_MAP = {
  'College of Information and Computing Sciences': 'CICS',
  'Faculty of Pharmacy':                         'FOP',
  'Faculty of Engineering':                      'FOE',
  'Senior High School':                          'SHS',
  'CICS': 'CICS',
  'FOP':  'FOP',
  'FOE':  'FOE',
  'SHS':  'SHS',
};

exports.submitDocumentRequest = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const {
      documentType,
      lastName,
      fullName,
      batch,
      collegeDepartment,  // either full name or code
      // program,          // ignored for now
      message             // Reason for Request
    } = req.body;

    // 1) Resolve college → code
    const collegeCode = COLLEGE_MAP[collegeDepartment];
    if (!collegeCode) {
      return res
        .status(400)
        .json({ message: `Invalid college selection: ${collegeDepartment}` });
    }

    // 2) Connect to Postgres
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
      // 3) Generate next doc_request_id
      const { rows } = await db.query(`
        SELECT doc_request_id
          FROM "Document_Requests"
         WHERE doc_request_id LIKE 'DR%'
         ORDER BY doc_request_id DESC
         LIMIT 1
      `);
      const lastId = rows[0]?.doc_request_id || 'DR000';
      const nextNum = parseInt(lastId.slice(2), 10) + 1;
      const doc_request_id = 'DR' + String(nextNum).padStart(3, '0');

      // 4) Defaults
      const request_type = 'Document';
      const is_shs       = (collegeCode === 'SHS');
      const status       = 'Pending';
      const admin_notes  = null;
      const created_at   = new Date().toISOString().split('T')[0];

      // 5) Insert—with collegeCode, NOTE: COLLEGE_ID (7), DEPARTMERNT(14), PROGRAM(15) are set to null temporarily for testing
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
           $5,$6,NULL,$8,
           NULL,$9,$10,$11,
           $12,$13,NULL,NULL
         )`,
        [
          doc_request_id,      // $1
          null,                // $2  user_id
          request_type,        // $3
          documentType,        // $4
          lastName,            // $5
          fullName,            // $6
          collegeCode,         // $7  mapped college_id
          is_shs,              // $8
          message,             // $9  purpose
          status,              // $10
          admin_notes,         // $11
          created_at,          // $12
          batch,               // $13
          collegeDepartment    // $14 text copy of the college name
          // $15 for program omitted, so program will be NULL
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
