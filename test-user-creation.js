const fetch = require('node-fetch');

async function testUserCreation() {
  const baseUrl = 'http://localhost:5000';
  
  // First login as admin to get a token
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@rollick.co.in',
      password: 'admin123'
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);
  
  if (!loginData.success) {
    console.error('Login failed');
    return;
  }
  
  const token = loginData.data.token;
  
  // Now try to create a user
  const createUserResponse = await fetch(`${baseUrl}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    })
  });
  
  const createUserData = await createUserResponse.json();
  console.log('Create user response:', createUserData);
  
  if (createUserData.success) {
    console.log('✅ User creation successful!');
  } else {
    console.log('❌ User creation failed:', createUserData.error);
  }
}

testUserCreation().catch(console.error);