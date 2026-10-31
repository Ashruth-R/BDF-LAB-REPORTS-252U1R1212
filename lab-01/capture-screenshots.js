const { spawn, execSync } = require('child_process');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function capture(file, url) {
    const outFile = path.join(__dirname, 'screenshots', file);
    console.log(`Capturing ${file} for ${url}...`);
    execSync(`"${edgePath}" --headless --disable-gpu "--screenshot=${outFile}" --window-size=1200,800 "${url}"`);
}

async function run() {
    // 1. Plain HTTP server
    console.log('Starting plain HTTP server...');
    const httpServer = spawn('node', ['http-server.js']);
    await new Promise(r => setTimeout(r, 1500));
    capture('01_http_server.png', 'http://localhost:3000/');
    httpServer.kill();
    await new Promise(r => setTimeout(r, 1000));

    // 2. Express server
    console.log('Starting Express server...');
    const expressServer = spawn('node', ['server.js']);
    await new Promise(r => setTimeout(r, 1500));

    const routes = [
        { file: '02_route_root.png', url: 'http://localhost:3000/' },
        { file: '03_route_about.png', url: 'http://localhost:3000/about' },
        { file: '04_route_time.png', url: 'http://localhost:3000/time' },
        { file: '05_route_404.png', url: 'http://localhost:3000/unknown' }
    ];

    for (const r of routes) {
        capture(r.file, r.url);
    }

    expressServer.kill();
    console.log('All 5 screenshots captured successfully!');
    process.exit(0);
}

run();

