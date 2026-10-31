/**
 * Lab 1 - Task 3: Plain Node.js HTTP Server
 * Course: Backend Development Fundamentals
 * 
 * Objective: Build a small web server using Node.js built-in 'http' module
 * that responds with "Hello" and listens on port 3000.
 */

const http = require('http');

const PORT = 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`[HTTP Server] Received ${req.method} request for ${req.url}`);
    
    // Set response HTTP header: status 200 OK and text/plain content type
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    
    // Send response body
    res.end('Hello');
});

// Start listening on port 3000
server.listen(PORT, () => {
    console.log(`[HTTP Server] Server is running at http://localhost:${PORT}/`);
    console.log(`[HTTP Server] Listening on port ${PORT}...`);
});
