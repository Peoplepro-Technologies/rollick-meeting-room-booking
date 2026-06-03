// Check if both servers are running and accessible
const http = require('http');

const servers = [
  { name: 'API Server', url: 'http://localhost:5000/api/rooms', method: 'HEAD' },
  { name: 'Client Dev Server', url: 'http://localhost:3000', method: 'GET' }
];

async function checkServer(server) {
  return new Promise((resolve) => {
    const req = http.request(server.url, { method: server.method }, (res) => {
      resolve({
        name: server.name,
        status: 'up',
        statusCode: res.statusCode,
        message: res.statusCode === 200 ? 'OK' : res.statusMessage
      });
    });

    req.on('error', (error) => {
      resolve({
        name: server.name,
        status: 'down',
        error: error.message
      });
    });

    req.end();
  });
}

async function checkAllServers() {
  console.log('Checking server connections...\n');

  const results = await Promise.all(servers.map(checkServer));

  results.forEach(result => {
    if (result.status === 'up') {
      console.log(`✓ ${result.name}: UP (${result.statusCode})`);
    } else {
      console.log(`✗ ${result.name}: DOWN - ${result.error}`);
    }
  });

  // Check if both are up
  const allUp = results.every(r => r.status === 'up');
  if (allUp) {
    console.log('\n✓ All servers are running!');
  } else {
    console.log('\n✗ Some servers are down.');
  }
}

checkAllServers();