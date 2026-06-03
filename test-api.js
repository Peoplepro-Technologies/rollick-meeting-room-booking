// Test API from Node.js
const http = require('http');

const API_URL = 'http://localhost:5000/api';

async function testAPI() {
  // Test login
  const loginData = JSON.stringify({
    username: 'admin@rollick.co.in',
    password: 'admin123'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginReq = http.request(loginOptions, (loginRes) => {
    let loginBody = '';
    loginRes.on('data', (chunk) => {
      loginBody += chunk;
    });
    loginRes.on('end', () => {
      console.log('Login Response:', loginRes.statusCode);
      console.log('Login Body:', loginBody);

      if (loginRes.statusCode === 200) {
        const loginData = JSON.parse(loginBody);
        const token = loginData.data.token;

        // Test rooms endpoint with token
        const roomsOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/rooms',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        const roomsReq = http.request(roomsOptions, (roomsRes) => {
          let roomsBody = '';
          roomsRes.on('data', (chunk) => {
            roomsBody += chunk;
          });
          roomsRes.on('end', () => {
            console.log('\nRooms Response:', roomsRes.statusCode);
            console.log('Rooms Body:', roomsBody);
          });
        });

        roomsReq.on('error', (error) => {
          console.error('Rooms error:', error);
        });

        roomsReq.end();
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('Login error:', error);
  });

  loginReq.write(loginData);
  loginReq.end();
}

testAPI();