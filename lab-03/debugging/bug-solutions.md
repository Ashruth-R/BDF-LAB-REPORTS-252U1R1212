# Lab 3: Debugging Common Backend Errors
## Case Study & Resolution Analysis

This document provides a systematic post-mortem analysis of the four defects examined in the Lab 3 debugging exercise.

---

### Bug 1: Port Conflict (`EADDRINUSE`)

#### 1. Symptom & Stack Trace
When launching the application on a port already claimed by another process:
```text
[CRASH REPRODUCED] System Error Encountered: EADDRINUSE
Error details: listen EADDRINUSE: address already in use 0.0.0.0:3000
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
    at Server.setupListenHandle [as _listen2] (node:net:2009:16)
    at listenInCluster (node:net:2066:12)
    at doListen (node:net:2231:7)
```

#### 2. Root Cause
In TCP/IP networking, only a single socket listener can bind to a specific IP and port combination at any given time. If an unclosed node process, zombie worker, or competing daemon is already listening on `0.0.0.0:3000`, the operating system rejects the second `bind()` syscall with `EADDRINUSE`.

#### 3. Faulty Code
```javascript
// Hardcoded port with no error handler
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
```

#### 4. Diagnostic & Resolution
1. **Find & Terminate the Conflicting Process**:
   - On Windows:
     ```powershell
     netstat -ano | findstr :3000
     taskkill /PID <PID> /F
     ```
   - On Linux/macOS:
     ```bash
     lsof -i :3000
     kill -9 <PID>
     ```
2. **Defensive Server Code**:
   Support dynamic fallback ports and listen for `'error'` events:
   ```javascript
   const PORT = process.env.PORT || 3000;
   const server = app.listen(PORT, '0.0.0.0', () => {
       console.log(`Server running on http://localhost:${PORT}/`);
   });

   server.on('error', (err) => {
       if (err.code === 'EADDRINUSE') {
           console.warn(`Port ${PORT} in use, retrying on port ${PORT + 1}...`);
           app.listen(PORT + 1, '0.0.0.0');
       } else {
           console.error('Fatal server error:', err);
       }
   });
   ```

---

### Bug 2: Wrong Import Path (`MODULE_NOT_FOUND`)

#### 1. Symptom & Stack Trace
```text
node:internal/modules/cjs/loader:1503
  throw err;
  ^

Error: Cannot find module './wrong_modules/sqlite-driver'
Require stack:
- C:\BDF_PROJECTS\lab-03\debugging\broken-server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1500:15)
    at defaultResolve (node:internal/modules/cjs/loader:1673:36)
  code: 'MODULE_NOT_FOUND'
```

#### 2. Root Cause
Node.js CommonJS `require()` searches according to resolution rules:
- Built-in modules (e.g. `path`, `http`)
- Local relative paths starting with `./` or `../`
- Installed modules inside `node_modules/`

When a typo exists in the relative path (e.g. wrong directory depth or misspelled filename), Node cannot locate the file on disk and halts execution with `code: 'MODULE_NOT_FOUND'`.

#### 3. Faulty Code
```javascript
// Incorrect relative path or incorrect package name
const { open } = require('./wrong_modules/sqlite-driver');
```

#### 4. Diagnostic & Resolution
Check `package.json` dependencies and verify exact relative paths using `__dirname`:
```javascript
// Correct module resolution from node_modules
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
```

---

### Bug 3: Table-Name Typo (`no such table`)

#### 1. Symptom & Stack Trace
```text
[Route Error caught]: SQLITE_ERROR: no such table: books
Error: SQLITE_ERROR: no such table: books
    at Statement.all (C:\BDF_PROJECTS\lab-03\node_modules\sqlite3\lib\sqlite3.js:58:20)
```

#### 2. Root Cause
Relational SQL engines strictly enforce table name identifiers. When the database schema defines the entity as `book` (singular), but an API route handler executes a query targeting `books` (plural), SQLite returns a runtime syntax/catalog error `SQLITE_ERROR: no such table: books`.

#### 3. Faulty Code
```javascript
app.get('/books', async (req, res) => {
    // Schema was created with "CREATE TABLE book ..."
    const result = await db.all('SELECT * FROM books;'); // Typo: books
    res.json(result);
});
```

#### 4. Diagnostic & Resolution
Synchronize SQL queries with the schema definition in DDL scripts:
```javascript
// Query aligned with actual table definition: 'book'
const result = await db.all('SELECT * FROM book ORDER BY id ASC;');
res.status(200).json(result);
```

---

### Bug 4: Missing `await` (`Unresolved Promise`)

#### 1. Symptom & Behavioral Defect
When querying the database, the API handler returns an empty JSON object `{}` instead of the expected array of books:
```json
{}
```
No exception is thrown because `db.all()` returns a valid Promise instance synchronously; however, the response is sent *before* the asynchronous database I/O completes.

#### 2. Root Cause
In Node.js async/await programming, asynchronous functions returning Promises (such as `db.all()`, `db.get()`, `db.run()`) must be explicitly unwrapped with `await`.
When `res.json(unawaitedPromise)` is invoked:
- Express invokes `JSON.stringify(unawaitedPromise)`.
- In JavaScript, a Promise object has no enumerable properties (`Object.keys(new Promise(...))` is `[]`).
- Therefore, `JSON.stringify(unawaitedPromise)` evaluates to `"{}"`.

#### 3. Faulty Code
```javascript
app.get('/books', async (req, res) => {
    // Missing 'await'
    const books = db.all('SELECT * FROM book;');
    console.log(books); // Output: Promise { <pending> }
    res.json(books);    // Serialized as "{}" to client!
});
```

#### 4. Diagnostic & Resolution
Prepend `await` to ensure execution pauses until the Promise resolves to the actual result set:
```javascript
app.get('/books', async (req, res) => {
    const books = await db.all('SELECT * FROM book;');
    res.status(200).json(books);
});
```

---

### Summary Checklist for Backend Debugging

| Bug Code / Symptom | Root Cause | Primary Fix |
| :--- | :--- | :--- |
| `EADDRINUSE` | Port already occupied | Kill process or use dynamic port fallback |
| `MODULE_NOT_FOUND` | Incorrect file or package path | Verify `package.json` dependencies and relative path |
| `no such table: <name>` | Typo in SQL table identifier | Synchronize SQL queries with DDL table definitions |
| `{}` returned instead of data | Missing `await` on DB Promise | Prepend `await` before asynchronous calls |

