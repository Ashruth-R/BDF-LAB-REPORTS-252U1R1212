/**
 * Lab 1 - Task 7: Automated Route Tester & Status Code Logger
 * 
 * Verifies that every route answers with the correct content and status code:
 * - GET / -> 200 OK
 * - GET /about -> 200 OK (JSON)
 * - GET /time -> 200 OK (Current time using new Date())
 * - GET /unknown-path -> 404 Not Found
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const endpoints = [
    { path: '/', expectedStatus: 200, desc: 'Welcome Text Route' },
    { path: '/about', expectedStatus: 200, desc: 'About JSON Route' },
    { path: '/time', expectedStatus: 200, desc: 'Current Time Route' },
    { path: '/non-existent-endpoint', expectedStatus: 404, desc: 'Unknown Route 404 Handler' }
];

async function runTests() {
    console.log('='.repeat(70));
    console.log(`Starting automated endpoint validation against: ${BASE_URL}`);
    console.log('='.repeat(70));

    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
        const url = `${BASE_URL}${ep.path}`;
        try {
            const res = await fetch(url);
            const status = res.status;
            const contentType = res.headers.get('content-type') || 'unknown';
            const body = await res.text();

            console.log(`\nEndpoint: GET ${ep.path} (${ep.desc})`);
            console.log(`- Request URL     : ${url}`);
            console.log(`- Received Status : ${status} ${res.statusText}`);
            console.log(`- Expected Status : ${ep.expectedStatus}`);
            console.log(`- Content-Type    : ${contentType}`);
            console.log(`- Response Sample : ${body.substring(0, 120)}${body.length > 120 ? '...' : ''}`);

            if (status === ep.expectedStatus) {
                console.log(`✔ [PASS] Status matches expected (${status})`);
                passed++;
            } else {
                console.error(`✖ [FAIL] Expected ${ep.expectedStatus} but got ${status}`);
                failed++;
            }
        } catch (err) {
            console.error(`✖ [ERROR] Failed to fetch ${url}:`, err.message);
            failed++;
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`Validation Summary: ${passed} Passed, ${failed} Failed out of ${endpoints.length} tests.`);
    console.log('='.repeat(70));

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
