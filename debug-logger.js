// Simple debug logger for API calls
const http = require('http');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'debug-logs.txt');

// Create log file if it doesn't exist
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '');
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const logData = JSON.parse(body);
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${JSON.stringify(logData, null, 2)}\n\n`;

        fs.appendFileSync(logFile, logEntry);
        console.log('Log received:', logData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error parsing log:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Not found' }));
  }
});

const PORT = 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Debug logger server running on port ${PORT}`);
});