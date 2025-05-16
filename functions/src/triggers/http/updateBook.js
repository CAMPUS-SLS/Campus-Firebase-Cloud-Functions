const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config(); // Load environment variables

exports.updateBook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const {
      book_id,
      admin_id,
      title,
      author,
      ISBN,
      Publisher,
      category,
      course_title,
      description,
      isfeatured,
      year_published,
      book_cover_url,
    } = req.body;

    if (
      !book_id || !admin_id || !title || !author || !ISBN || !Publisher || !category ||
      !course_title || !description || isfeatured === undefined || !year_published || !book_cover_url
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      // Ensure the book exists
      const existing = await db.query(`SELECT * FROM "Books" WHERE book_id = $1`, [book_id]);
      if (existing.rows.length === 0) {
        await db.end();
        return res.status(404).json({ message: 'Book not found' });
      }

      // Resolve course_id from course_title
      const courseRes = await db.query(
        `SELECT course_id FROM "Course" WHERE course_title = $1`,
        [course_title]
      );

      if (courseRes.rows.length === 0) {
        await db.end();
        return res.status(400).json({ message: 'Course title not found' });
      }

      const course_id = courseRes.rows[0].course_id;

      // Perform the update
      await db.query(
        `UPDATE "Books" SET
          admin_id = $1,
          title = $2,
          author = $3,
          ISBN = $4,
          Publisher = $5,
          category = $6,
          course_id = $7,
          description = $8,
          isfeatured = $9,
          year_published = $10,
          book_cover_url = $11
        WHERE book_id = $12`,
        [
          admin_id,
          title,
          author,
          ISBN,
          Publisher,
          category,
          course_id,
          description,
          isfeatured,
          year_published,
          book_cover_url,
          book_id
        ]
      );

      await db.end();
      return res.status(200).json({ message: 'Book updated successfully', book_id });

    } catch (err) {
      console.error('Error in updateBook:', err);
      if (db) await db.end();
      return res.status(500).json({
        message: 'Server error',
        error: err.message,
        stack: err.stack,
      });
    }
  });
});
