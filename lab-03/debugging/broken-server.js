/**
 * Lab 3 - Faculty Debugging Exercise: Broken Server Reproduction
 * 
 * This file contains the 4 bugs handed out by the faculty:
 * 1. Bug 1: Port conflict (EADDRINUSE)
 * 2. Bug 2: Wrong import path (MODULE_NOT_FOUND)
 * 3. Bug 3: Table-name typo (SQLITE_ERROR: no such table: books)
 * 4. Bug 4: Missing await on database query
 * 
 * Modes:
 *   node debugging/broken-server.js --bug=1  (Port conflict)
 *   node debugging/broken-server.js --bug=2  (Wrong import path)
 *   node debugging/broken-server.js --bug=3  (Table-name typo)
 *   node debugging/broken-server.js --bug=4  (Missing await)
 *   node debugging/broken-server.js --fixed  (All bugs resolved)
 */

const express = require('express');
const path = require('path');
const http = require('http');

const activeArg = process.argv[2] || '--fixed';

console.log(`\n===============================================================`);
console.log(`[Lab 3 Debugging Exercise] Running with mode: ${activeArg}`);
console.log(`===============================================================\n`);

// BUG 2: Wrong Import Path
let open, sqlite3;
if (activeArg === '--bug=2') {
    console.log('[DEBUG EXERCISE] Triggering Bug 2: Wrong import path...');
    // Intentional bad path: trying to import from non-existent directory
    const wrongPath = './wrong_modules/sqlite-driver';
    console.error(`Attempting require('${wrongPath}')...`);
    require(wrongPath); // Throws MODULE_NOT_FOUND
} else {
    // FIXED: Proper module imports
    ({ open } = require('sqlite'));
    sqlite3 = require('sqlite3');
}

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, '..', 'books.db');
let db = null;

// Route demonstrating BUG 3 (table name typo) and BUG 4 (missing await)
app.get('/books', async (req, res) => {
    try {
        if (activeArg === '--bug=3') {
            console.log('[DEBUG EXERCISE] Triggering Bug 3: Table-name typo...');
            // Bug 3: Typo 'books' instead of table 'book'
            const result = await db.all('SELECT * FROM books;');
            return res.status(200).json(result);
        }

        if (activeArg === '--bug=4') {
            console.log('[DEBUG EXERCISE] Triggering Bug 4: Missing await...');
            // Bug 4: Missing await on db.all()
            // db.all returns a Promise. Without await, express serializes an empty Promise object: {}
            const unawaitedPromise = db.all('SELECT * FROM book LIMIT 3;');
            console.log('[Missing await debug] Value of unawaitedPromise is Promise:', unawaitedPromise instanceof Promise);
            return res.status(200).json({
                warning: 'Missing await bug demonstration',
                resultType: Object.prototype.toString.call(unawaitedPromise),
                serializedPromise: unawaitedPromise // Express json() serializes Promise as {}
            });
        }

        // FIXED: Correct table name ('book') and properly awaited
        const books = await db.all('SELECT * FROM book LIMIT 5;');
        return res.status(200).json(books);
    } catch (error) {
        console.error(`[Route Error caught]: ${error.message}`);
        return res.status(500).json({ message: error.message });
    }
});

// BUG 1: Port conflict (EADDRINUSE)
async function startServer() {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    const PORT = 3000;

    if (activeArg === '--bug=1') {
        console.log('[DEBUG EXERCISE] Triggering Bug 1: Port conflict (EADDRINUSE)...');
        // Create a dummy server that occupies port 3000 first
        const dummyOccupier = http.createServer((q, r) => r.end('Occupier'));
        dummyOccupier.listen(PORT, '0.0.0.0', () => {
            console.log(`[Occupier] Port ${PORT} occupied by dummy service.`);
            console.log(`[Broken Server] Now attempting to start broken Express server on the SAME port ${PORT}...`);

            // This will crash unhandled with EADDRINUSE if not caught
            const conflictingServer = app.listen(PORT, '0.0.0.0');
            conflictingServer.on('error', (err) => {
                console.error(`\n[CRASH REPRODUCED] System Error Encountered: ${err.code}`);
                console.error(`Error details: ${err.message}`);
                console.error(`Stack trace snippet: ${err.stack.split('\n').slice(0, 3).join('\n')}\n`);
                dummyOccupier.close();
                process.exit(1);
            });
        });
        return;
    }

    // FIXED version: Handle port conflicts gracefully or pick fallback / environment PORT
    const listenPort = process.env.PORT || PORT;
    const serverInstance = app.listen(listenPort, '0.0.0.0', () => {
        console.log(`[Fixed Server] Successfully listening on http://localhost:${listenPort}/books`);
    });

    serverInstance.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[EADDRINUSE Detected] Port ${listenPort} is in use. Automatic fallback to port ${listenPort + 1}...`);
            app.listen(listenPort + 1, '0.0.0.0', () => {
                console.log(`[Fixed Server] Gracefully recovered on fallback port ${listenPort + 1}!`);
            });
        } else {
            console.error(`Unhandled server error: ${err.message}`);
        }
    });

    return { db, serverInstance };
}

if (require.main === module) {
    startServer().catch(err => {
        console.error('[Startup Fatal Error]:', err.message);
        process.exit(1);
    });
}

module.exports = { app, startServer };

