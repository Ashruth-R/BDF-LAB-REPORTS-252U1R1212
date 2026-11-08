/**
 * Lab 3: Database Initialization & Seeding Script
 * 
 * Creates 'books.db' and the 'book' table with schema:
 * book(id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, author TEXT, price INTEGER, pages INTEGER)
 * Seeds records covering diverse prices, titles, and authors for query testing.
 */

const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const DB_PATH = path.join(__dirname, 'books.db');

const initialBooks = [
    { title: 'Clean Code', author: 'Robert C. Martin', price: 650, pages: 464 },
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', price: 720, pages: 352 },
    { title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 450, pages: 176 },
    { title: "You Don't Know JS: Scope & Closures", author: 'Kyle Simpson', price: 550, pages: 278 },
    { title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma et al.', price: 890, pages: 395 },
    { title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', price: 780, pages: 448 },
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', price: 950, pages: 616 },
    { title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen', price: 1250, pages: 1312 },
    { title: 'Node.js Design Patterns', author: 'Mario Casciaro', price: 820, pages: 642 },
    { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 520, pages: 472 },
    { title: 'Clean Architecture', author: 'Robert C. Martin', price: 690, pages: 352 },
    { title: 'Fullstack Node.js', author: 'Nate Murray', price: 380, pages: 290 }
];

async function initializeDatabase() {
    console.log(`[Database Init] Opening SQLite database at: ${DB_PATH}`);
    const db = await open({
        filename: DB_PATH,
        driver: sqlite3.Database
    });

    console.log('[Database Init] Creating table "book" if not exists...');
    await db.run(`
        CREATE TABLE IF NOT EXISTS book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            price INTEGER NOT NULL,
            pages INTEGER NOT NULL
        );
    `);

    // Reset table for clean seed data
    await db.run(`DELETE FROM book;`);
    await db.run(`DELETE FROM sqlite_sequence WHERE name = 'book';`);

    console.log('[Database Init] Seeding sample books using parameterized queries (?)...');
    for (const b of initialBooks) {
        await db.run(
            'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);',
            [b.title, b.author, b.price, b.pages]
        );
    }
    console.log(`[Database Init] Successfully seeded ${initialBooks.length} records.`);

    // Display all rows
    const books = await db.all('SELECT * FROM book ORDER BY id ASC;');
    console.log('\n================ Current "book" Table Content ================');
    console.table(books);
    console.log('===============================================================\n');

    await db.close();
    console.log('[Database Init] Database connection closed successfully.');
}

if (require.main === module) {
    initializeDatabase().catch(err => {
        console.error('[Database Init Error]:', err);
        process.exit(1);
    });
}

module.exports = { initializeDatabase, DB_PATH, initialBooks };

