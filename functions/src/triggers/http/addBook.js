const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config(); // Load local .env variables

exports.addBook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Add CORS headers manually as a fallback
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const {
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
      !admin_id || !title || !author || !ISBN || !Publisher || !category ||
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

      // Check for duplicate book (by title + author)
      const checkRes = await db.query(
        `SELECT COUNT(*) AS count FROM "Books" WHERE title = $1 AND author = $2`,
        [title, author]
      );

      if (parseInt(checkRes.rows[0].count) > 0) {
        await db.end();
        return res.status(400).json({ message: 'A book with the same title and author already exists' });
      }

      // Generate unique book_id
      let book_id;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!isUnique && attempts < maxAttempts) {
        const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
        book_id = `B${randomNumber.toString().padStart(8, '0')}`;

        const idCheck = await db.query(
          `SELECT COUNT(*) AS count FROM "Books" WHERE book_id = $1`,
          [book_id]
        );

        isUnique = parseInt(idCheck.rows[0].count) === 0;
        attempts++;
      }

      if (!isUnique) {
        await db.end();
        return res.status(500).json({ message: 'Failed to generate unique book ID after multiple attempts' });
      }

      // Retrieve course_id based on course_title
      const courseRes = await db.query(
        `SELECT course_id FROM "Course" WHERE course_title = $1`,
        [course_title]
      );

      if (courseRes.rows.length === 0) {
        await db.end();
        return res.status(400).json({ message: 'Course title not found' });
      }

      const course_id = courseRes.rows[0].course_id;

      // Insert new book
      await db.query(
        `INSERT INTO "Books" (
          book_id, admin_id, title, author, ISBN, Publisher, category,
          course_id, description, isfeatured, year_published, book_cover_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12
        )`,
        [
          book_id,
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
        ]
      );

      await db.end();

      return res.status(200).json({ message: "Book added successfully", book_id });

    } catch (err) {
        console.error('Error in addBook:', err);

        if (db) await db.end();

        return res.status(500).json({
            message: 'Server error',
            error: err.message,
            stack: err.stack,
        });
    }
  });
});
