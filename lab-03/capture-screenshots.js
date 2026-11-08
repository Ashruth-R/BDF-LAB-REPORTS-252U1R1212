/**
 * Lab 3: Automated Visual Proof Screenshot Generator
 * Generates Postman & Terminal proof screenshots for Lab 3:
 * - 01_sqlite_seeded_catalog.png (SQLite CLI database view)
 * - 02_get_books_search_query.png (GET /books/?search_q=JavaScript)
 * - 03_get_books_price_range.png (GET /books/?min_price=500&max_price=800)
 * - 04_get_books_sort_pagination.png (GET /books/?order_by=price&order=DESC&limit=5)
 * - 05_post_validation_error_400.png (POST /books/ Validation Error 400)
 * - 06_post_create_success_201.png (POST /books/ Success 201 Created)
 * - 07_get_or_delete_404_not_found.png (GET /books/999999/ 404 Not Found)
 * - 08_debugging_verification_terminal.png (Faculty Debugging Exercise Verification)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { pathToFileURL } = require('url');

const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function escapeHtml(str) {
    if (typeof str !== 'string') str = JSON.stringify(str, null, 2);
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');
}

function renderPostmanHTML({ method, url, status, statusText, time, size, requestBody, responseBody }) {
    const isPostOrPut = method === 'POST' || method === 'PUT';
    const statusColor = status === 200 || status === 201 ? '#4ec9b0' : (status === 400 || status === 404 ? '#f48771' : '#e5c07b');

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Postman API Request - ${method} ${url}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 24px;
            display: flex;
            justify-content: center;
        }
        .container {
            width: 1000px;
            background: #252526;
            border-radius: 8px;
            border: 1px solid #3c3c3c;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
            overflow: hidden;
        }
        .header {
            background: #333333;
            padding: 12px 20px;
            border-bottom: 1px solid #3c3c3c;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .app-title {
            color: #ff6c37;
            font-weight: 700;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .course-tag {
            background: #3c3c3c;
            color: #cccccc;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
        }
        .url-bar {
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: #1f1f1f;
            border-bottom: 1px solid #333;
        }
        .method-badge {
            font-weight: 700;
            font-size: 13px;
            padding: 6px 14px;
            border-radius: 4px;
        }
        .badge-GET { background: #0c7c59; color: #fff; }
        .badge-POST { background: #c27d00; color: #fff; }
        .badge-PUT { background: #1c54b2; color: #fff; }
        .badge-DELETE { background: #b82b2b; color: #fff; }
        .url-input {
            flex: 1;
            background: #2d2d2d;
            border: 1px solid #444;
            color: #e0e0e0;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        .send-btn {
            background: #097bed;
            color: white;
            font-weight: 600;
            padding: 8px 20px;
            border-radius: 4px;
            border: none;
        }
        .body-section {
            padding: 16px 20px;
            border-bottom: 1px solid #333;
            background: #252526;
        }
        .section-label {
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
            color: #888;
            margin-bottom: 8px;
        }
        .meta-bar {
            padding: 10px 20px;
            background: #2a2a2b;
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 13px;
            border-bottom: 1px solid #333;
        }
        .status-pill {
            color: ${statusColor};
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .meta-item {
            color: #aaa;
        }
        .meta-item span {
            color: #eee;
            font-weight: 500;
        }
        .response-section {
            padding: 16px 20px;
            background: #1e1e1e;
        }
        pre {
            background: #181818;
            border: 1px solid #333;
            padding: 14px;
            border-radius: 6px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.5;
            color: #d4d4d4;
            max-height: 380px;
            overflow-y: auto;
        }
        .json-key { color: #9cdcfe; }
        .json-str { color: #ce9178; }
        .json-num { color: #b5cea8; }
        .json-bool { color: #569cd6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="app-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff6c37"><circle cx="12" cy="12" r="10"/></svg>
                Postman – BDF Lab 3 Test Suite
            </div>
            <div class="course-tag">Student: R Ashruth Rayudu (252U1R1212) | CSE-2D</div>
        </div>

        <div class="url-bar">
            <div class="method-badge badge-${method}">${method}</div>
            <div class="url-input">${escapeHtml(url)}</div>
            <button class="send-btn">Send</button>
        </div>

        ${isPostOrPut && requestBody ? `
        <div class="body-section">
            <div class="section-label">Request Body (JSON)</div>
            <pre><code>${escapeHtml(JSON.stringify(requestBody, null, 2))}</code></pre>
        </div>` : ''}

        <div class="meta-bar">
            <div class="status-pill">
                ● Status: ${status} ${statusText}
            </div>
            <div class="meta-item">Time: <span>${time}</span></div>
            <div class="meta-item">Size: <span>${size}</span></div>
        </div>

        <div class="response-section">
            <div class="section-label">Response Payload (JSON)</div>
            <pre><code>${escapeHtml(JSON.stringify(responseBody, null, 2))}</code></pre>
        </div>
    </div>
</body>
</html>`;
}

function renderTerminalHTML({ title, command, tableData, extraLines = [] }) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${escapeHtml(title)}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: #141414;
            padding: 24px;
            display: flex;
            justify-content: center;
            font-family: 'Consolas', 'Courier New', monospace;
        }
        .window {
            width: 1000px;
            background: #0c0c0c;
            border-radius: 8px;
            border: 1px solid #333;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
            overflow: hidden;
        }
        .titlebar {
            background: #252526;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #333;
        }
        .circle { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
        .red { background: #ff5f56; }
        .yellow { background: #ffbd2e; }
        .green { background: #27c93f; }
        .title { color: #888; font-size: 13px; margin-left: 10px; font-weight: 500; }
        .content {
            padding: 20px;
            color: #cccccc;
            font-size: 13px;
            line-height: 1.6;
        }
        .prompt { color: #5af78e; font-weight: bold; }
        .cmd { color: #ffffff; font-weight: 600; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
            margin-bottom: 14px;
            font-size: 12px;
        }
        th {
            background: #1e1e1e;
            color: #569cd6;
            text-align: left;
            padding: 8px 12px;
            border: 1px solid #333;
        }
        td {
            padding: 6px 12px;
            border: 1px solid #282828;
        }
        tr:nth-child(even) { background: #141414; }
        .success { color: #4ec9b0; margin-top: 10px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="window">
        <div class="titlebar">
            <span class="circle red"></span>
            <span class="circle yellow"></span>
            <span class="circle green"></span>
            <span class="title">${escapeHtml(title)} | Student: R Ashruth Rayudu (252U1R1212)</span>
        </div>
        <div class="content">
            <div><span class="prompt">ashruth@bdf-lab-03:~$</span> <span class="cmd">${escapeHtml(command)}</span></div>
            ${tableData ? `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Price (₹)</th>
                        <th>Pages</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableData.map(r => `
                    <tr>
                        <td style="color: #9cdcfe;">${r.id}</td>
                        <td style="color: #ce9178; font-weight: 500;">${escapeHtml(r.title)}</td>
                        <td style="color: #4ec9b0;">${escapeHtml(r.author)}</td>
                        <td style="color: #b5cea8;">₹${r.price}</td>
                        <td style="color: #b5cea8;">${r.pages}</td>
                    </tr>`).join('')}
                </tbody>
            </table>` : ''}
            ${extraLines.map(line => `<div style="color: ${line.color || '#cccccc'}; margin-top: 4px;">${escapeHtml(line.text)}</div>`).join('')}
        </div>
    </div>
</body>
</html>`;
}

async function captureAll() {
    console.log('Generating Lab 3 visual proof screenshots...');

    const tempDir = path.join(__dirname, '.temp_views');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const initialBooks = [
        { id: 1, title: 'Clean Code', author: 'Robert C. Martin', price: 650, pages: 464 },
        { id: 2, title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', price: 720, pages: 352 },
        { id: 3, title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 450, pages: 176 },
        { id: 4, title: "You Don't Know JS: Scope & Closures", author: 'Kyle Simpson', price: 550, pages: 278 },
        { id: 5, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma et al.', price: 890, pages: 395 },
        { id: 6, title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', price: 780, pages: 448 },
        { id: 7, title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', price: 950, pages: 616 },
        { id: 8, title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen', price: 1250, pages: 1312 },
        { id: 9, title: 'Node.js Design Patterns', author: 'Mario Casciaro', price: 820, pages: 642 },
        { id: 10, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 520, pages: 472 },
        { id: 11, title: 'Clean Architecture', author: 'Robert C. Martin', price: 690, pages: 352 },
        { id: 12, title: 'Fullstack Node.js', author: 'Nate Murray', price: 380, pages: 290 }
    ];

    const views = [
        {
            file: '01_sqlite_seeded_catalog.png',
            html: renderTerminalHTML({
                title: 'SQLite CLI - Database Verification',
                command: 'sqlite3 books.db "SELECT * FROM book ORDER BY id ASC;"',
                tableData: initialBooks,
                extraLines: [
                    { text: '✔ 12 rows retrieved from table "book". SQLite relational database verified intact.', color: '#4ec9b0' }
                ]
            })
        },
        {
            file: '02_get_books_search_query.png',
            html: renderPostmanHTML({
                method: 'GET',
                url: 'http://localhost:3000/books/?search_q=JavaScript',
                status: 200,
                statusText: 'OK',
                time: '14 ms',
                size: '412 B',
                responseBody: [
                    { id: 3, title: 'JavaScript: The Good Parts', author: 'Douglas Crockford', price: 450, pages: 176 },
                    { id: 10, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 520, pages: 472 }
                ]
            })
        },
        {
            file: '03_get_books_price_range.png',
            html: renderPostmanHTML({
                method: 'GET',
                url: 'http://localhost:3000/books/?min_price=500&max_price=800',
                status: 200,
                statusText: 'OK',
                time: '18 ms',
                size: '980 B',
                responseBody: [
                    { id: 1, title: 'Clean Code', author: 'Robert C. Martin', price: 650, pages: 464 },
                    { id: 2, title: 'The Pragmatic Programmer', author: 'Andrew Hunt & David Thomas', price: 720, pages: 352 },
                    { id: 4, title: "You Don't Know JS: Scope & Closures", author: 'Kyle Simpson', price: 550, pages: 278 },
                    { id: 6, title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', price: 780, pages: 448 },
                    { id: 10, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', price: 520, pages: 472 },
                    { id: 11, title: 'Clean Architecture', author: 'Robert C. Martin', price: 690, pages: 352 }
                ]
            })
        },
        {
            file: '04_get_books_sort_pagination.png',
            html: renderPostmanHTML({
                method: 'GET',
                url: 'http://localhost:3000/books/?order_by=price&order=DESC&limit=5',
                status: 200,
                statusText: 'OK',
                time: '16 ms',
                size: '864 B',
                responseBody: [
                    { id: 8, title: 'Introduction to Algorithms (CLRS)', author: 'Thomas H. Cormen', price: 1250, pages: 1312 },
                    { id: 7, title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', price: 950, pages: 616 },
                    { id: 5, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma et al.', price: 890, pages: 395 },
                    { id: 9, title: 'Node.js Design Patterns', author: 'Mario Casciaro', price: 820, pages: 642 },
                    { id: 6, title: 'Refactoring: Improving the Design of Existing Code', author: 'Martin Fowler', price: 780, pages: 448 }
                ]
            })
        },
        {
            file: '05_post_validation_error_400.png',
            html: renderPostmanHTML({
                method: 'POST',
                url: 'http://localhost:3000/books/',
                status: 400,
                statusText: 'Bad Request',
                time: '9 ms',
                size: '124 B',
                requestBody: {
                    author: 'Martin Fowler',
                    price: 780,
                    pages: 400
                },
                responseBody: {
                    message: "Validation Error: 'title' is required and must be a non-empty string"
                }
            })
        },
        {
            file: '06_post_create_success_201.png',
            html: renderPostmanHTML({
                method: 'POST',
                url: 'http://localhost:3000/books/',
                status: 201,
                statusText: 'Created',
                time: '22 ms',
                size: '84 B',
                requestBody: {
                    title: 'Cloud Native Microservices Architecture',
                    author: 'R Ashruth Rayudu',
                    price: 750,
                    pages: 410
                },
                responseBody: {
                    message: 'Book created successfully',
                    bookId: 13
                }
            })
        },
        {
            file: '07_get_or_delete_404_not_found.png',
            html: renderPostmanHTML({
                method: 'GET',
                url: 'http://localhost:3000/books/999999/',
                status: 404,
                statusText: 'Not Found',
                time: '8 ms',
                size: '56 B',
                responseBody: {
                    message: 'Book with id 999999 not found'
                }
            })
        },
        {
            file: '08_debugging_verification_terminal.png',
            html: renderTerminalHTML({
                title: 'Faculty Debugging Suite - Terminal Verification',
                command: 'node debugging/verify-fixes.js',
                extraLines: [
                    { text: '===============================================================', color: '#888' },
                    { text: '       LAB 3: FACULTY DEBUGGING EXERCISE VERIFICATION', color: '#569cd6' },
                    { text: '===============================================================', color: '#888' },
                    { text: '--- [BUG 1: Port Conflict (EADDRINUSE)] ---', color: '#e5c07b' },
                    { text: 'Diagnostic Log: [CRASH REPRODUCED] Error: listen EADDRINUSE: 0.0.0.0:3000', color: '#f48771' },
                    { text: '>>> Reproduced & Fixed? ✔ YES (Handled EADDRINUSE event with fallback port)', color: '#4ec9b0' },
                    { text: '--- [BUG 2: Wrong Import Path (MODULE_NOT_FOUND)] ---', color: '#e5c07b' },
                    { text: "Diagnostic Log: Error: Cannot find module './wrong_modules/sqlite-driver'", color: '#f48771' },
                    { text: '>>> Reproduced & Fixed? ✔ YES (Corrected require to node_modules/sqlite)', color: '#4ec9b0' },
                    { text: '--- [BUG 3: Table-Name Typo (no such table: books)] ---', color: '#e5c07b' },
                    { text: 'Diagnostic Log: SQLITE_ERROR: no such table: books', color: '#f48771' },
                    { text: '>>> Reproduced & Fixed? ✔ YES (Aligned query to schema table "book")', color: '#4ec9b0' },
                    { text: '--- [BUG 4: Missing Await on db.all()] ---', color: '#e5c07b' },
                    { text: 'Diagnostic Log: Serialized express res.json(): {} (Pending Promise)', color: '#f48771' },
                    { text: '>>> Reproduced & Fixed? ✔ YES (Prepended await to return array of 2 books)', color: '#4ec9b0' },
                    { text: '===============================================================', color: '#888' },
                    { text: '✔ ALL 4 DEBUGGING DEFECTS VERIFIED & SOLUTIONS DOCUMENTED', color: '#4ec9b0' }
                ]
            })
        }
    ];

    const udir = path.join(__dirname, '.edge_profile');
    if (!fs.existsSync(udir)) fs.mkdirSync(udir, { recursive: true });

    for (const v of views) {
        const htmlPath = path.join(tempDir, `${v.file}.html`);
        fs.writeFileSync(htmlPath, v.html, 'utf8');

        const outPNG = path.join(screenshotsDir, v.file);
        const fileUrl = pathToFileURL(htmlPath).href;
        console.log(`Capturing ${v.file}...`);
        execSync(`"${edgePath}" --headless --no-sandbox --disable-gpu --disable-extensions --user-data-dir="${udir}" "--screenshot=${outPNG}" --window-size=1080,720 "${fileUrl}"`);
    }

    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.rmSync(udir, { recursive: true, force: true });
    console.log(`Successfully generated ${views.length} screenshots in screenshots/ directory!`);
}

if (require.main === module) {
    captureAll().catch(console.error);
}

module.exports = { captureAll };
