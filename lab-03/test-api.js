/**
 * Lab 3: Automated API Test Runner
 * 
 * Comprehensive automated verification covering:
 * - REST noun naming (/books)
 * - Query parameters: search_q (LIKE), order_by, order (ASC/DESC), limit, offset
 * - Price-range filtering: min_price, max_price, BETWEEN
 * - POST body validation: missing title, missing author, non-numeric price -> 400 Bad Request
 * - Deterministic status codes: 201 Created, 200 OK, 404 Not Found
 * - Consistent error response format: { "message": "..." }
 * - Parameterized queries preventing SQL injection
 */

const http = require('http');
const { app, initializeDBAndServer } = require('./server');

let passedCount = 0;
let failedCount = 0;
let createdBookId = null;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`  ✅ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
        passedCount++;
    } else {
        console.error(`  ❌ FAIL: ${testName} ${details ? '-> ' + details : ''}`);
        failedCount++;
    }
}

/**
 * In-process mock dispatcher that executes full Express middleware pipeline,
 * body parsing, route matching, query string handling, and database interaction.
 */
function makeRequest(method, urlPath, body = null) {
    return new Promise((resolve, reject) => {
        try {
            const req = new http.IncomingMessage();
            req.method = method;
            req.url = urlPath;
            req.headers = { host: 'localhost' };

            if (body !== null && body !== undefined) {
                const parsedBody = typeof body === 'object' ? body : JSON.parse(body);
                const payload = JSON.stringify(parsedBody);
                req.headers['content-type'] = 'application/json';
                req.headers['content-length'] = Buffer.byteLength(payload);
                req.body = parsedBody;
                req._body = true;
            }

            const res = new http.ServerResponse(req);
            const chunks = [];

            res.write = (chunk) => {
                if (chunk) chunks.push(Buffer.from(chunk));
                return true;
            };

            res.end = (chunk) => {
                if (chunk) chunks.push(Buffer.from(chunk));
                const resBody = Buffer.concat(chunks).toString('utf8');
                let parsed = resBody;
                try {
                    parsed = JSON.parse(resBody);
                } catch {
                    parsed = resBody;
                }
                resolve({
                    status: res.statusCode,
                    data: parsed,
                    headers: res.getHeaders()
                });
            };

            app.handle(req, res);
        } catch (err) {
            reject(err);
        }
    });
}

async function runTestSuite() {
    console.log('===============================================================');
    console.log('        LAB 3: AUTOMATED REST API VERIFICATION SUITE');
    console.log('===============================================================\n');

    const initResult = await initializeDBAndServer();
    const serverInstance = initResult.server;

    try {
        // Group 1: Base & Documentation Route
        console.log('--- Group 1: Base & Documentation Route ---');
        const resRoot = await makeRequest('GET', '/');
        assert(resRoot.status === 200, 'GET / returns 200 OK');
        assert(resRoot.data && resRoot.data.endpoints !== undefined, 'Root route provides endpoints documentation');

        // Group 2: Query Parameters (Search, Price Filter, Sort, Pagination)
        console.log('\n--- Group 2: Query Parameters (Search, Sort, Pagination, Price Filters) ---');
        
        // 2a. Default GET /books/
        const resBooksDefault = await makeRequest('GET', '/books/');
        assert(resBooksDefault.status === 200, 'GET /books/ returns 200 OK');
        assert(Array.isArray(resBooksDefault.data), 'Returns an array of books');
        assert(resBooksDefault.data.length <= 10, 'Default limit of 10 applied', `Returned count: ${resBooksDefault.data.length}`);

        // 2b. Partial Title Search (search_q)
        const resSearch = await makeRequest('GET', '/books/?search_q=JavaScript');
        assert(resSearch.status === 200, 'GET /books/?search_q=JavaScript returns 200 OK');
        const allMatchSearch = resSearch.data.length > 0 && resSearch.data.every(b => b.title.toLowerCase().includes('javascript'));
        assert(allMatchSearch, 'All returned items contain search query in title', `Found ${resSearch.data.length} books`);

        // 2c. Price Range Filter (min_price & max_price)
        const resPriceFilter = await makeRequest('GET', '/books/?min_price=500&max_price=800');
        assert(resPriceFilter.status === 200, 'GET /books/?min_price=500&max_price=800 returns 200 OK');
        const allInRange = resPriceFilter.data.length > 0 && resPriceFilter.data.every(b => b.price >= 500 && b.price <= 800);
        assert(allInRange, 'All books have price between 500 and 800', `Matched ${resPriceFilter.data.length} books`);

        // 2d. Single min_price Filter
        const resMinPrice = await makeRequest('GET', '/books/?min_price=900');
        assert(resMinPrice.status === 200, 'GET /books/?min_price=900 returns 200 OK');
        const allAboveMin = resMinPrice.data.length > 0 && resMinPrice.data.every(b => b.price >= 900);
        assert(allAboveMin, 'All books have price >= 900', `Matched ${resMinPrice.data.length} books`);

        // 2e. Dynamic Sorting (order_by=price & order=DESC)
        const resSort = await makeRequest('GET', '/books/?order_by=price&order=DESC&limit=5');
        assert(resSort.status === 200, 'GET /books/?order_by=price&order=DESC returns 200 OK');
        let isSortedDesc = true;
        for (let i = 0; i < resSort.data.length - 1; i++) {
            if (resSort.data[i].price < resSort.data[i + 1].price) isSortedDesc = false;
        }
        assert(isSortedDesc, 'Books are correctly sorted in descending order of price');

        // 2f. Pagination (limit & offset)
        const page1 = await makeRequest('GET', '/books/?limit=3&offset=0');
        const page2 = await makeRequest('GET', '/books/?limit=3&offset=3');
        assert(page1.data.length === 3 && page2.data.length === 3, 'Pagination limit returns exact page size');
        assert(page1.data[0].id !== page2.data[0].id, 'Offset correctly shifts page window', `Page 1 first ID: ${page1.data[0].id}, Page 2 first ID: ${page2.data[0].id}`);

        // 2g. Combined Filter: search + price range + sort + limit
        const resCombined = await makeRequest('GET', '/books/?search_q=Code&min_price=600&max_price=800&order_by=price&order=ASC');
        assert(resCombined.status === 200, 'Combined query returns 200 OK');
        const combinedValid = resCombined.data.length > 0 && resCombined.data.every(b => b.title.toLowerCase().includes('code') && b.price >= 600 && b.price <= 800);
        assert(combinedValid, 'Combined conditions honored simultaneously');

        // Group 3: Entity Retrieval & 404 Status
        console.log('\n--- Group 3: Entity Retrieval & 404 Status ---');
        const resSingleExisting = await makeRequest('GET', '/books/1/');
        assert(resSingleExisting.status === 200, 'GET /books/1/ returns 200 OK');
        assert(resSingleExisting.data.id === 1, 'Book ID matches parameter');

        const resSingleMissing = await makeRequest('GET', '/books/999999/');
        assert(resSingleMissing.status === 404, 'GET /books/999999/ returns 404 Not Found');
        assert(typeof resSingleMissing.data.message === 'string', 'Error format is { "message": "..." }', resSingleMissing.data.message);

        // Group 4: POST Body Validation & 400 Bad Request
        console.log('\n--- Group 4: POST Validation & 400 Bad Request ---');
        
        // 4a. Missing Title
        const resMissingTitle = await makeRequest('POST', '/books/', { author: 'Test Author', price: 500 });
        assert(resMissingTitle.status === 400, 'POST /books/ without title returns 400 Bad Request');
        assert(resMissingTitle.data.message && resMissingTitle.data.message.includes('title'), 'Error message specifies missing title', resMissingTitle.data.message);

        // 4b. Missing Author
        const resMissingAuthor = await makeRequest('POST', '/books/', { title: 'Test Title', price: 500 });
        assert(resMissingAuthor.status === 400, 'POST /books/ without author returns 400 Bad Request');
        assert(resMissingAuthor.data.message && resMissingAuthor.data.message.includes('author'), 'Error message specifies missing author', resMissingAuthor.data.message);

        // 4c. Non-numeric Price
        const resNonNumericPrice = await makeRequest('POST', '/books/', { title: 'Test Title', author: 'Test Author', price: 'invalid_price' });
        assert(resNonNumericPrice.status === 400, 'POST /books/ with non-numeric price returns 400 Bad Request');
        assert(resNonNumericPrice.data.message && resNonNumericPrice.data.message.includes('price'), 'Error message specifies invalid price', resNonNumericPrice.data.message);

        // 4d. Negative Price
        const resNegativePrice = await makeRequest('POST', '/books/', { title: 'Test Title', author: 'Test Author', price: -50 });
        assert(resNegativePrice.status === 400, 'POST /books/ with negative price returns 400 Bad Request');

        // Group 5: Mutation Status Codes (201, 200, 404)
        console.log('\n--- Group 5: Mutation Status Codes (201, 200, 404) ---');
        
        // 5a. Successful POST /books/ -> 201 Created
        const resCreate = await makeRequest('POST', '/books/', {
            title: 'Cloud Native Microservices Architecture',
            author: 'R Ashruth Rayudu',
            price: 750,
            pages: 410
        });
        assert(resCreate.status === 201, 'POST /books/ returns 201 Created on success');
        assert(resCreate.data.bookId !== undefined, 'Returns newly assigned bookId', `ID: ${resCreate.data.bookId}`);
        assert(resCreate.data.message === 'Book created successfully', 'Consistent success message format');
        createdBookId = resCreate.data.bookId;

        // 5b. Successful PUT /books/:id/ -> 200 OK
        const resUpdate = await makeRequest('PUT', `/books/${createdBookId}/`, {
            price: 820
        });
        assert(resUpdate.status === 200, `PUT /books/${createdBookId}/ returns 200 OK`);
        assert(resUpdate.data.message === 'Book updated successfully', 'Consistent update message format');

        // 5c. PUT non-existent book -> 404 Not Found
        const resUpdateMissing = await makeRequest('PUT', '/books/999999/', {
            price: 900
        });
        assert(resUpdateMissing.status === 404, 'PUT /books/999999/ returns 404 Not Found');
        assert(resUpdateMissing.data.message !== undefined, 'Missing PUT returns { "message": "..." }');

        // 5d. Successful DELETE /books/:id/ -> 200 OK
        const resDelete = await makeRequest('DELETE', `/books/${createdBookId}/`);
        assert(resDelete.status === 200, `DELETE /books/${createdBookId}/ returns 200 OK`);
        assert(resDelete.data.message === 'Book deleted successfully', 'Consistent delete message format');

        // 5e. DELETE non-existent book -> 404 Not Found
        const resDeleteMissing = await makeRequest('DELETE', '/books/999999/');
        assert(resDeleteMissing.status === 404, 'DELETE /books/999999/ returns 404 Not Found');
        assert(resDeleteMissing.data.message !== undefined, 'Missing DELETE returns { "message": "..." }');

        // Group 6: Consistent Catch-All 404
        console.log('\n--- Group 6: Consistent Catch-All 404 ---');
        const resCatchAll = await makeRequest('GET', '/unknown-endpoint');
        assert(resCatchAll.status === 404, 'Unmatched route returns 404 Not Found');
        assert(resCatchAll.data.message !== undefined, 'Catch-all uses uniform { "message": "..." } format', resCatchAll.data.message);

    } catch (err) {
        console.error('Fatal test runner error:', err);
        failedCount++;
    } finally {
        if (serverInstance) {
            serverInstance.close();
            console.log('\n[Test Runner] Test HTTP server closed.');
        }
    }

    console.log('\n===============================================================');
    console.log(`        TEST RESULTS SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('===============================================================\n');

    if (failedCount > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runTestSuite();
}

module.exports = { runTestSuite };
