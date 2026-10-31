/**
 * Lab 1: Node.js and Express server
 * Course: Backend Development Fundamentals · Year II Term II
 * Faculty: Joel Prashanth D
 * 
 * Tasks 4, 5, 6:
 * - Express initialization with app.listen(3000)
 * - Route: GET / (Welcome text)
 * - Route: GET /about (JSON with name, registration number, section)
 * - Route: GET /time (Current date and time using new Date())
 * - Route: 404 handler for unknown paths
 */

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Request logger middleware to track requests and status codes
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Route 1: GET / (Welcome text)
app.get('/', (req, res) => {
    res.status(200).send('Welcome to Lab 1: Node.js and Express Server!');
});

// Route 2: GET /about (JSON with name and section)
app.get('/about', (req, res) => {
    res.status(200).json({
        name: process.env.STUDENT_NAME || 'R Ashruth Rayudu',
        registrationNumber: process.env.STUDENT_REG_NO || '252U1R1212',
        section: process.env.STUDENT_SECTION || 'Core CSE-2D',
        course: 'Backend Development Fundamentals',
        term: 'Year II Term II',
        lab: 'Lab 01 - Node.js and Express.js Fundamentals'
    });
});

// Route 3: GET /time (Current date and time using new Date())
app.get('/time', (req, res) => {
    const currentDate = new Date();
    res.status(200).send(`Current Date and Time: ${currentDate.toString()}`);
});

// Route 4: 404 Catch-All Handler for any unknown path
app.use((req, res) => {
    res.status(404).send(`404 Not Found: Cannot ${req.method} ${req.originalUrl}`);
});

// Start Express server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Express Server] Server running successfully on port ${PORT}`);
    console.log(`[Express Server] Endpoints available:`);
    console.log(`  - GET  http://localhost:${PORT}/`);
    console.log(`  - GET  http://localhost:${PORT}/about`);
    console.log(`  - GET  http://localhost:${PORT}/time`);
    console.log(`  - Test 404 at http://localhost:${PORT}/unknown`);
});

module.exports = { app, server };
