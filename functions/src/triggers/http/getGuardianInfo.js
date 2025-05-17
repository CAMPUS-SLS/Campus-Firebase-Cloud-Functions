// functions/src/triggers/http/getGuardianInfo.js

const { Client } = require("pg")
const functions = require("firebase-functions")
const cors = require("cors")({ origin: true })
const admin = require("firebase-admin")
require("dotenv").config()

if (!admin.apps.length) {
  admin.initializeApp()
}

exports.getGuardianInfo = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    let db
    try {
      const userId = req.query.user_id
      const authHeader = req.headers.authorization

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header" })
      }

      const idToken = authHeader.split("Bearer ")[1]
      await admin.auth().verifyIdToken(idToken)

      if (!userId) {
        return res.status(400).json({ message: "Missing 'user_id' in query parameters." })
      }

      console.log("Received request for user_id:", userId)

      db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })

      await db.connect()

      const result = await db.query(
        `
        SELECT 
          guardian_name,
          address_id AS guardian_address_id,
          home_phone_no,
          work_phone_no
        FROM "Guardian"
        WHERE user_id = $1
        `,
        [userId],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Guardian info not found." })
      }

      return res.status(200).json({ guardianInfo: result.rows[0] })
    } catch (err) {
      console.error("Error in getGuardianInfo:", err)
      return res.status(500).json({ message: "Server error: " + err.message })
    } finally {
      if (db) {
        try {
          await db.end()
        } catch (closeErr) {
          console.error("Error closing database connection:", closeErr)
        }
      }
    }
  })
})
