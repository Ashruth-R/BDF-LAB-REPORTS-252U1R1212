/**
 * Lab 3: REST API, Query Parameters, Validation, and Debugging
 * Course: Backend Development Fundamentals · Year II Term II
 * Faculty: Joel Prashanth D / Shiva Sai Teja
 * Student: R Ashruth Rayudu (252U1R1212) - CSE-2D
 * 
 * Features & Endpoints:
 * 1. Noun endpoints (/books) matching HTTP verbs
 * 2. GET /books/ with query parameters:
 *    - search_q: partial title match using parameterized LIKE ?
 *    - min_price & max_price: price range filter using BETWEEN ? AND ?
 *    - order_by: whitelisted sorting field (default: 'id')
 *    - order: whitelisted sort direction 'ASC' | 'DESC' (default: 'ASC')
 *    - limit: maximum rows to return (default: 10)
 *    - offset: rows to skip (default: 0)
 * 3. GET /books/:bookId/ - Retrieve a specific book (200 OK or 404 Not Found)
 * 4. POST /books/ - Strict body validation (missing title, author, non-numeric price -> 400 Bad Request, 201 Created on success)
 * 5. PUT /books/:bookId/ - Update an existing book (404 Not Found or 200 OK)
 * 6. DELETE /books/:bookId/ - Delete a book (404 Not Found or 200 OK)
 * 7. Standardized JSON response format: { "message": "..." } for errors and mutations
 * 8. Parameterized SQL queries preventing SQL injection vulnerabilities
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

// Middleware for parsing JSON request bodies
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Root Route: API documentation & Student Metadata
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Welcome to Lab 3: REST API with Query Parameters, Validation, and Error Handling',
        student: {
            name: 'R Ashruth Rayudu',
            registrationNumber: '252U1R1212',
            section: 'Core CSE-2D',
            course: 'Backend Development Fundamentals'
        },
        endpoints: {
            listBooks: 'GET /books/?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=',
            getBookById: 'GET /books/:bookId/',
            createBook: 'POST /books/',
            updateBook: 'PUT /books/:bookId/',
            deleteBook: 'DELETE /books/:bookId/'
        }
    });
});

/**
 * Route 1: GET /books/
 * Supports search_q, min_price, max_price, order_by, order, limit, offset
 */
app.get('/books/', async (req, res) => {
    try {
        const {
            search_q = '',
            order_by = 'id',
            order = 'ASC',
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = req.query;

        // Whitelist validation for ORDER BY column to avoid SQL injection
        const allowedOrderByColumns = ['id', 'title', 'author', 'price', 'pages'];
        const sanitizedOrderBy = allowedOrderByColumns.includes(order_by.toLowerCase())
            ? order_by.toLowerCase()
            : 'id';

        // Whitelist validation for sort direction
        const sanitizedOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Parse and validate numeric limit and offset
        const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
        const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

        // Dynamic query builder with parameterized placeholders
        const whereClauses = [];
        const queryParams = [];

        // Partial title match filter
        if (search_q && search_q.trim() !== '') {
            whereClauses.push('title LIKE ?');
            queryParams.push(`%${search_q.trim()}%`);
        }

        // Price range filter
        const hasMinPrice = min_price !== undefined && min_price !== '' && !isNaN(Number(min_price));
        const hasMaxPrice = max_price !== undefined && max_price !== '' && !isNaN(Number(max_price));

        if (hasMinPrice && hasMaxPrice) {
            whereClauses.push('price BETWEEN ? AND ?');
            queryParams.push(Number(min_price), Number(max_price));
        } else if (hasMinPrice) {
            whereClauses.push('price >= ?');
            queryParams.push(Number(min_price));
        } else if (hasMaxPrice) {
            whereClauses.push('price <= ?');
            queryParams.push(Number(max_price));
        }

        let sql = 'SELECT * FROM book';
        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        sql += ` ORDER BY ${sanitizedOrderBy} ${sanitizedOrder}`;
        sql += ` LIMIT ? OFFSET ?;`;
        queryParams.push(parsedLimit, parsedOffset);

        const books = await db.all(sql, queryParams);
        res.status(200).json(books);
    } catch (error) {
        console.error('Error fetching books:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * Route 2: GET /books/:bookId/
 * Retrieve single book by primary key
 */
app.get('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const book = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);

        if (!book) {
            return res.status(404).json({ message: `Book with id ${bookId} not found` });
        }

        res.status(200).json(book);
    } catch (error) {
        console.error('Error fetching single book:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * Route 3: POST /books/
 * Validates body: title (required string), author (required string), price (required numeric)
 * Returns 201 Created on success, 400 Bad Request on validation failure
 */
app.post('/books/', async (req, res) => {
    try {
        const { title, author, price, pages } = req.body || {};

        // Strict validation: missing title
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                message: "Validation Error: 'title' is required and must be a non-empty string"
            });
        }

        // Strict validation: missing author
        if (!author || typeof author !== 'string' || author.trim() === '') {
            return res.status(400).json({
                message: "Validation Error: 'author' is required and must be a non-empty string"
            });
        }

        // Strict validation: missing or non-numeric price
        if (price === undefined || price === null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                message: "Validation Error: 'price' is required and must be a valid non-negative number"
            });
        }

        // Validation for pages if provided
        const numericPages = pages !== undefined && !isNaN(Number(pages)) ? Math.max(1, parseInt(pages, 10)) : 100;

        const insertQuery = `
            INSERT INTO book (title, author, price, pages)
            VALUES (?, ?, ?, ?);
        `;
        const result = await db.run(insertQuery, [
            title.trim(),
            author.trim(),
            Number(price),
            numericPages
        ]);

        res.status(201).json({
            message: 'Book created successfully',
            bookId: result.lastID
        });
    } catch (error) {
        console.error('Error creating book:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * Route 4: PUT /books/:bookId/
 * Update book fields. Returns 404 if not found, 400 on invalid input, 200 on success
 */
app.put('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { title, author, price, pages } = req.body || {};

        // Check if book exists
        const existingBook = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
        if (!existingBook) {
            return res.status(404).json({ message: `Book with id ${bookId} not found` });
        }

        // Validate price if supplied
        if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
            return res.status(400).json({
                message: "Validation Error: 'price' must be a valid non-negative number"
            });
        }

        const updatedTitle = title !== undefined && typeof title === 'string' && title.trim() !== ''
            ? title.trim()
            : existingBook.title;

        const updatedAuthor = author !== undefined && typeof author === 'string' && author.trim() !== ''
            ? author.trim()
            : existingBook.author;

        const updatedPrice = price !== undefined && !isNaN(Number(price))
            ? Number(price)
            : existingBook.price;

        const updatedPages = pages !== undefined && !isNaN(Number(pages))
            ? parseInt(pages, 10)
            : existingBook.pages;

        const updateQuery = `
            UPDATE book
            SET title = ?, author = ?, price = ?, pages = ?
            WHERE id = ?;
        `;
        await db.run(updateQuery, [updatedTitle, updatedAuthor, updatedPrice, updatedPages, bookId]);

        res.status(200).json({
            message: 'Book updated successfully',
            bookId: parseInt(bookId, 10)
        });
    } catch (error) {
        console.error('Error updating book:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * Route 5: DELETE /books/:bookId/
 * Delete book by ID. Returns 404 if not found, 200 on success
 */
app.delete('/books/:bookId/', async (req, res) => {
    try {
        const { bookId } = req.params;

        const existingBook = await db.get('SELECT * FROM book WHERE id = ?;', [bookId]);
        if (!existingBook) {
            return res.status(404).json({ message: `Book with id ${bookId} not found` });
        }

        await db.run('DELETE FROM book WHERE id = ?;', [bookId]);

        res.status(200).json({
            message: 'Book deleted successfully',
            bookId: parseInt(bookId, 10)
        });
    } catch (error) {
        console.error('Error deleting book:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Consistent 404 Catch-All Handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

/**
 * initializeDBAndServer()
 * Guarantee database connection before Express starts listening.
 */
const initializeDBAndServer = async (customPort) => {
    const listenPort = customPort || PORT;
    try {
        console.log(`[initializeDBAndServer] Connecting to SQLite database at: ${dbPath}`);
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        await db.run(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                price INTEGER NOT NULL,
                pages INTEGER NOT NULL
            );
        `);
        console.log('[initializeDBAndServer] Database connected and schema ready.');

        return new Promise((resolve, reject) => {
            server = app.listen(listenPort, '0.0.0.0', () => {
                console.log(`[Express Server] Server is running at http://localhost:${listenPort}/`);
                console.log(`[Express Server] Ready to accept REST requests.`);
                resolve({ db, server, port: listenPort });
            });

            server.on('error', (err) => {
                console.error(`[Server Error]: ${err.message}`);
                reject(err);
            });
        });
    } catch (error) {
        console.error(`[initializeDBAndServer Error]: ${error.message}`);
        process.exit(1);
    }
};

if (require.main === module) {
    initializeDBAndServer();
}

module.exports = { app, initializeDBAndServer, getDb: () => db };
