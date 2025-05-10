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

exports.getDocumentRequests = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await db.collection("Document_Requests").get();

    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // optional: used for routing to detail view
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        documentType: data.documentType || "",
        requestDate: data.requestDate || "",
        status: data.status || "",
      };
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching document requests:", error);
    res.status(500).send("Internal Server Error");
  }
});