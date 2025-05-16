const { Client } = require('pg');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });
require('dotenv').config(); // Load environment variables

exports.deleteBook = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({ message: 'Missing book_id in request body' });
    }

    const db = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await db.connect();

      // Check if the book exists
      const check = await db.query(
        `SELECT * FROM "Books" WHERE book_id = $1`,
        [book_id]
      );

      if (check.rows.length === 0) {
        await db.end();
        return res.status(404).json({ message: 'Book not found' });
      }

      // Perform deletion
      await db.query(
        `DELETE FROM "Books" WHERE book_id = $1`,
        [book_id]
      );

      await db.end();

      return res.status(200).json({ message: 'Book deleted successfully', book_id });

    } catch (err) {
      console.error('Error in deleteBook:', err);
      if (db) await db.end();

      return res.status(500).json({
        message: 'Server error',
        error: err.message,
        stack: err.stack,
      });
    }
  });
});
