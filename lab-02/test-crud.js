/**
 * Lab 2 - Task 6: Automated CRUD Test Runner
 * Validates all 5 endpoints sequentially:
 * 1. GET /books/ (List all)
 * 2. GET /books/:bookId/ (Get single)
 * 3. POST /books/ (Create book)
 * 4. PUT /books/:bookId/ (Update book)
 * 5. DELETE /books/:bookId/ (Delete book)
 * 6. GET /books/:bookId/ (Confirm 404 after deletion)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runCrudTests() {
    console.log('='.repeat(75));
    console.log(`Starting automated CRUD test suite against: ${BASE_URL}`);
    console.log('='.repeat(75));

    let passed = 0;
    let failed = 0;
    let createdBookId = null;

    // Test 1: GET /books/ (all)
    try {
        console.log('\n[TEST 1] GET /books/ (Retrieve all books)');
        const res = await fetch(`${BASE_URL}/books/`);
        const status = res.status;
        const data = await res.json();
        console.log(`- Status: ${status} (Expected: 200)`);
        console.log(`- Total books found: ${data.length}`);
        console.log(`- Sample first book: [ID ${data[0]?.id}] "${data[0]?.title}" by ${data[0]?.author}`);

        if (status === 200 && Array.isArray(data) && data.length >= 10) {
            console.log('✔ [PASS] Successfully fetched all books.');
            passed++;
        } else {
            console.error('✖ [FAIL] Unexpected response or book count < 10');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    // Test 2: GET /books/1/ (one)
    try {
        console.log('\n[TEST 2] GET /books/1/ (Retrieve single book by ID)');
        const res = await fetch(`${BASE_URL}/books/1/`);
        const status = res.status;
        const data = await res.json();
        console.log(`- Status: ${status} (Expected: 200)`);
        console.log(`- Book retrieved: [ID ${data.id}] "${data.title}" | Price: Rs.${data.price} | Pages: ${data.pages}`);

        if (status === 200 && data.id === 1) {
            console.log('✔ [PASS] Successfully retrieved single book.');
            passed++;
        } else {
            console.error('✖ [FAIL] Could not retrieve book with ID 1');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    // Test 3: POST /books/ (add new book)
    try {
        console.log('\n[TEST 3] POST /books/ (Create a new book)');
        const newBook = {
            title: 'Database Internals: A Deep Dive into Distributed Systems',
            author: 'Alex Petrov',
            price: 899,
            pages: 376
        };
        const res = await fetch(`${BASE_URL}/books/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBook)
        });
        const status = res.status;
        const data = await res.json();
        createdBookId = data.bookId;
        console.log(`- Status: ${status} (Expected: 201)`);
        console.log(`- Response payload:`, data);

        if (status === 201 && createdBookId) {
            console.log(`✔ [PASS] Book created with assigned ID: ${createdBookId}`);
            passed++;
        } else {
            console.error('✖ [FAIL] POST failed to create book');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    // Test 4: Verify Newly Created Book via GET /books/:bookId/
    try {
        console.log(`\n[TEST 4] GET /books/${createdBookId}/ (Verify newly created record)`);
        const res = await fetch(`${BASE_URL}/books/${createdBookId}/`);
        const status = res.status;
        const data = await res.json();
        console.log(`- Status: ${status} (Expected: 200)`);
        console.log(`- Verified book: "${data.title}" by ${data.author}`);

        if (status === 200 && data.id === createdBookId && data.price === 899) {
            console.log('✔ [PASS] New book verified in SQLite database.');
            passed++;
        } else {
            console.error('✖ [FAIL] Verification of created book failed');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    // Test 5: PUT /books/:bookId/ (update)
    try {
        console.log(`\n[TEST 5] PUT /books/${createdBookId}/ (Update book details)`);
        const updatePayload = {
            title: 'Database Internals (Second Edition)',
            author: 'Alex Petrov',
            price: 999,
            pages: 410
        };
        const res = await fetch(`${BASE_URL}/books/${createdBookId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });
        const status = res.status;
        const data = await res.json();
        console.log(`- Status: ${status} (Expected: 200)`);
        console.log(`- Response:`, data);

        // Fetch to confirm updated data
        const verifyRes = await fetch(`${BASE_URL}/books/${createdBookId}/`);
        const updatedBook = await verifyRes.json();
        console.log(`- Updated Book in DB: "${updatedBook.title}" | Price: Rs.${updatedBook.price} | Pages: ${updatedBook.pages}`);

        if (status === 200 && updatedBook.price === 999 && updatedBook.pages === 410) {
            console.log('✔ [PASS] Successfully updated book details.');
            passed++;
        } else {
            console.error('✖ [FAIL] Book update validation failed');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    // Test 6: DELETE /books/:bookId/ (remove)
    try {
        console.log(`\n[TEST 6] DELETE /books/${createdBookId}/ (Remove book by ID)`);
        const res = await fetch(`${BASE_URL}/books/${createdBookId}/`, {
            method: 'DELETE'
        });
        const status = res.status;
        const data = await res.json();
        console.log(`- Status: ${status} (Expected: 200)`);
        console.log(`- Response:`, data);

        if (status === 200) {
            console.log('✔ [PASS] Delete request succeeded.');
            passed++;
        } else {
            console.error('✖ [FAIL] Delete request failed');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    // Test 7: Confirm 404 after deletion
    try {
        console.log(`\n[TEST 7] GET /books/${createdBookId}/ (Confirm 404 Not Found after deletion)`);
        const res = await fetch(`${BASE_URL}/books/${createdBookId}/`);
        const status = res.status;
        const data = await res.json();
        console.log(`- Status: ${status} (Expected: 404)`);
        console.log(`- Response error:`, data);

        if (status === 404) {
            console.log('✔ [PASS] Confirmed book no longer exists (HTTP 404).');
            passed++;
        } else {
            console.error('✖ [FAIL] Expected 404 for deleted book');
            failed++;
        }
    } catch (e) {
        console.error('✖ [ERROR]:', e.message);
        failed++;
    }

    console.log('\n' + '='.repeat(75));
    console.log(`Test Execution Summary: ${passed} Passed, ${failed} Failed out of 7 tests.`);
    console.log('='.repeat(75) + '\n');

    if (failed > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runCrudTests().catch(err => {
        console.error('Test Runner Failed:', err);
        process.exit(1);
    });
}

module.exports = { runCrudTests };
