/**
 * Lab 2: SQLite database and CRUD routes
 * Course: Backend Development Fundamentals · Year II Term II
 * Faculty: Shiva Sai Teja
 * 
 * Tasks:
 * 1. nodemon configuration and script execution
 * 2. SQLite database connection with 'book' table
 * 3. initializeDBAndServer() async function
 * 4. CRUD routes:
 *    - GET /books/ (Retrieve all books)
 *    - GET /books/:bookId/ (Retrieve a single book)
 *    - POST /books/ (Add a new book)
 *    - PUT /books/:bookId/ (Update an existing book)
 *    - DELETE /books/:bookId/ (Remove a book)
 * 5. Parameterized queries (? placeholders) for all input operations
 */

const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'books.db');

let db = null;
let server = null;

// Middleware for parsing JSON bodies
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Root Route - Welcome & API Documentation
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Lab 2: SQLite Database and CRUD Operations API',
        student: {
            name: 'R Ashruth Rayudu',
            registrationNumber: '252U1R1212',
            section: 'Core CSE-2D',
            course: 'Backend Development Fundamentals'
        },
        endpoints: {
            getAllBooks: 'GET /books/',
            getSingleBook: 'GET /books/:bookId/',
            addBook: 'POST /books/',
            updateBook: 'PUT /books/:bookId/',
            deleteBook: 'DELETE /books/:bookId/'
        }
    });
});

// Route 1: GET /books/ (Retrieve all books)
app.get('/books/', async (req, res) => {
    try {
        const getBooksQuery = `SELECT * FROM book ORDER BY id ASC;`;
        const booksArray = await db.all(getBooksQuery);
        res.status(200).json(booksArray);
    } catch (error) {
        console.error('Error fetching all books:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route 2: GET /books/:bookId/ (Retrieve one specific book)
app.get('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
        const book = await db.get(getBookQuery, [bookId]);

        if (!book) {
            return res.status(404).json({ error: `Book with id ${bookId} not found` });
        }
        res.status(200).json(book);
    } catch (error) {
        console.error('Error fetching book:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route 3: POST /books/ (Add a new book)
app.post('/books/', async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        if (!title || !author || price === undefined || pages === undefined) {
            return res.status(400).json({
                error: 'Missing required fields: title, author, price, and pages are required'
            });
        }

        const addBookQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;
        const result = await db.run(addBookQuery, [title, author, price, pages]);

        res.status(201).json({
            message: 'Book Added Successfully',
            bookId: result.lastID
        });
    } catch (error) {
        console.error('Error adding book:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route 4: PUT /books/:bookId/ (Update an existing book)
app.put('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, price, pages } = req.body;

        // Verify existence first
        const checkQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkQuery, [bookId]);

        if (!existingBook) {
            return res.status(404).json({ error: `Book with id ${bookId} not found` });
        }

        const updateBookQuery = `
            UPDATE book
            SET title = ?, author = ?, price = ?, pages = ?
            WHERE id = ?;
        `;
        await db.run(updateBookQuery, [
            title !== undefined ? title : existingBook.title,
            author !== undefined ? author : existingBook.author,
            price !== undefined ? price : existingBook.price,
            pages !== undefined ? pages : existingBook.pages,
            bookId
        ]);

        res.status(200).json({
            message: 'Book Details Updated Successfully',
            bookId: parseInt(bookId, 10)
        });
    } catch (error) {
        console.error('Error updating book:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Route 5: DELETE /books/:bookId/ (Remove a book)
app.delete('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;

        // Check if book exists
        const checkQuery = `SELECT * FROM book WHERE id = ?;`;
        const existingBook = await db.get(checkQuery, [bookId]);

        if (!existingBook) {
            return res.status(404).json({ error: `Book with id ${bookId} not found` });
        }

        const deleteBookQuery = `DELETE FROM book WHERE id = ?;`;
        await db.run(deleteBookQuery, [bookId]);

        res.status(200).json({
            message: 'Book Deleted Successfully',
            bookId: parseInt(bookId, 10)
        });
    } catch (error) {
        console.error('Error deleting book:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// 404 Catch-All Handler
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

/**
 * Task 3: initializeDBAndServer()
 * Connects to SQLite database and starts Express server only on successful connection.
 */
const initializeDBAndServer = async () => {
    try {
        console.log(`[initializeDBAndServer] Connecting to SQLite database at: ${dbPath}`);
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Ensure table exists on startup
        await db.run(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                price INTEGER NOT NULL,
                pages INTEGER NOT NULL
            );
        `);
        console.log('[initializeDBAndServer] Database connected successfully.');

        server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`[Express Server] Server is running at http://localhost:${PORT}/`);
            console.log(`[Express Server] Ready to accept CRUD requests.`);
        });

        return { db, server };
    } catch (error) {
        console.error(`[initializeDBAndServer Error]: ${error.message}`);
        process.exit(1);
    }
};

// Start server if executed directly
if (require.main === module) {
    initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer, getDb: () => db };
