// functions/src/triggers/http/getCourseInfo.js

const { Client } = require("pg")
const functions = require("firebase-functions")
const cors = require("cors")({ origin: true })
const admin = require("firebase-admin")
require("dotenv").config()

if (!admin.apps.length) {
  admin.initializeApp()
}

exports.getCourseInfo = functions.https.onRequest((req, res) => {
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
        return res.status(400).json({ message: "Missing user_id in query parameters." })
      }

      db = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })

      await db.connect()

      const result = await db.query(
        `
        SELECT 
          d.department_name AS course,
          d.department_name AS degree,
          c.college_name AS college,
          CASE 
            WHEN cur.is_active THEN 'On-going'
            ELSE 'Inactive'
          END AS status
        FROM "Student" s
        JOIN "Curriculum" cur ON s.curriculum_id = cur.curriculum_id
        JOIN "Department" d ON cur.department_id = d.department_id
        JOIN "College" c ON d.college_id = c.college_id
        WHERE s.user_id = $1
        `,
        [userId],
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Course information not found." })
      }

      return res.status(200).json({ courseInfo: result.rows[0] })
    } catch (err) {
      console.error("Error in getCourseInfo:", err)
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
