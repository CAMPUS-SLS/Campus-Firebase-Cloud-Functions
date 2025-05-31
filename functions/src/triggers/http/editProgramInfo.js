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

exports.getDocumentsAccordingToDepartment = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { departmentid, newCredits, newGwa, documents } = req.body;

    const updateQuery = `
      UPDATE "Graduation_Requirement"
      SET required_credits = $1, minimum_gwa = $2
      WHERE department_id = $3
      RETURNING *;
    `;

    const deleteQuery = `
      DELETE FROM "Graduation_Document"
      WHERE department_id = $1 AND document_name NOT IN (${documents.map((_, i) => `$${i + 2}`).join(', ')});
    `;

    try {
      const updatedRequirement = await pool.query(updateQuery, [newCredits, newGwa, departmentid]);

      const deleteParams = [departmentid, ...documents];
      const deletedDocuments = await pool.query(deleteQuery, deleteParams);

      return res.status(200).json({
        updatedRequirement: updatedRequirement.rows,
        deletedDocumentsCount: deletedDocuments.rowCount
      });
    } catch (error) {
      console.error('Database error:', error.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
});
