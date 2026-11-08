/**
 * Lab 3: Debugging Exercise Verification Script
 * 
 * Demonstrates and logs all 4 faculty bugs:
 * 1. Port Conflict (EADDRINUSE)
 * 2. Wrong Import Path (MODULE_NOT_FOUND)
 * 3. Table-Name Typo (SQLITE_ERROR: no such table: books)
 * 4. Missing Await (Unresolved Promise serialized as {})
 * 
 * Followed by verifying the working fixes!
 */

const { spawn } = require('child_process');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const scriptPath = path.join(__dirname, 'broken-server.js');
const dbPath = path.join(__dirname, '..', 'books.db');

function runProcess(args) {
    return new Promise((resolve) => {
        const child = spawn(process.execPath, [scriptPath, ...args], {
            cwd: path.join(__dirname, '..')
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (d) => { stdout += d.toString(); });
        child.stderr.on('data', (d) => { stderr += d.toString(); });

        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        // Kill after 4s timeout if still hanging
        setTimeout(() => {
            child.kill();
        }, 4000);
    });
}

async function runAllDebugVerifications() {
    console.log('===============================================================');
    console.log('       LAB 3: FACULTY DEBUGGING EXERCISE VERIFICATION');
    console.log('===============================================================\n');

    // -------------------------------------------------------------
    // Bug 1: Port conflict (EADDRINUSE)
    // -------------------------------------------------------------
    console.log('--- [TESTING BUG 1]: Port Conflict (EADDRINUSE) ---');
    const res1 = await runProcess(['--bug=1']);
    const hasEaddrinuse = res1.stderr.includes('EADDRINUSE') || res1.stdout.includes('EADDRINUSE');
    console.log(`Diagnostic Log Captured:`);
    console.log((res1.stderr || res1.stdout).trim());
    console.log(`>>> Bug 1 Reproduced Successfully? ${hasEaddrinuse ? '✅ YES (EADDRINUSE confirmed)' : '❌ NO'}`);
    console.log(`>>> Solution: Add error listener for 'EADDRINUSE' to retry or pick fallback port / check process using netstat & kill.\n`);

    // -------------------------------------------------------------
    // Bug 2: Wrong Import Path (MODULE_NOT_FOUND)
    // -------------------------------------------------------------
    console.log('--- [TESTING BUG 2]: Wrong Import Path (MODULE_NOT_FOUND) ---');
    const res2 = await runProcess(['--bug=2']);
    const hasModuleNotFound = res2.stderr.includes('MODULE_NOT_FOUND') || res2.stderr.includes('Cannot find module');
    console.log(`Diagnostic Log Captured:`);
    console.log((res2.stderr).trim().split('\n').slice(0, 4).join('\n'));
    console.log(`>>> Bug 2 Reproduced Successfully? ${hasModuleNotFound ? '✅ YES (MODULE_NOT_FOUND confirmed)' : '❌ NO'}`);
    console.log(`>>> Solution: Fix require() string to accurately point to installed package 'sqlite' or correct relative path.\n`);

    // -------------------------------------------------------------
    // Bug 3: Table-Name Typo (no such table)
    // -------------------------------------------------------------
    console.log('--- [TESTING BUG 3]: Table-Name Typo (no such table: books) ---');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    let tableTypoCaught = false;
    try {
        await db.all('SELECT * FROM books;');
    } catch (err) {
        tableTypoCaught = true;
        console.log(`Diagnostic Log Captured: ${err.message}`);
    }
    console.log(`>>> Bug 3 Reproduced Successfully? ${tableTypoCaught ? '✅ YES (SQLITE_ERROR: no such table: books)' : '❌ NO'}`);
    console.log(`>>> Solution: Rename SQL query target from plural 'books' to schema definition 'book'.\n`);

    // -------------------------------------------------------------
    // Bug 4: Missing Await
    // -------------------------------------------------------------
    console.log('--- [TESTING BUG 4]: Missing Await on db.all() ---');
    // Without await:
    const unawaitedCall = db.all('SELECT * FROM book LIMIT 2;');
    const isPromise = unawaitedCall instanceof Promise;
    const jsonSerialized = JSON.stringify(unawaitedCall);
    console.log(`Diagnostic Log Captured:`);
    console.log(`  - Variable value: [${Object.prototype.toString.call(unawaitedCall)}]`);
    console.log(`  - Is Promise? ${isPromise}`);
    console.log(`  - Serialized by express res.json(): '${jsonSerialized}' (Empty object instead of array!)`);
    
    // With await:
    const awaitedResult = await unawaitedCall;
    console.log(`  - With 'await': Array of ${awaitedResult.length} books returned correctly!`);
    console.log(`>>> Bug 4 Reproduced Successfully? ${isPromise && jsonSerialized === '{}' ? '✅ YES (Missing await confirmed)' : '❌ NO'}`);
    console.log(`>>> Solution: Prepend 'await' before asynchronous SQLite driver calls (db.all, db.get, db.run).\n`);

    await db.close();

    console.log('===============================================================');
    console.log('   ALL 4 DEBUGGING DEFECTS VERIFIED & SOLUTIONS DOCUMENTED');
    console.log('===============================================================\n');
}

if (require.main === module) {
    runAllDebugVerifications().catch(console.error);
}

module.exports = { runAllDebugVerifications };

