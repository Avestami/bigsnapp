const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock user data
const users = [
  {
    id: 1,
    email: 'avestanabizadeh@gmail.com',
    password: '@Amir@7270',
    firstName: 'avesta',
    lastName: 'nabizadeh',
    phone: '09935107935'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server is running' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Mock JWT tokens
    const accessToken = 'mock-access-token-' + Date.now();
    const refreshToken = 'mock-refresh-token-' + Date.now();
    
    console.log('Login successful for:', email);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        },
        accessToken,
        refreshToken
      }
    });
  } else {
    console.log('Login failed for:', email);
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }
});

// Register endpoint
app.post('/api/auth/register', (req, res) => {
  console.log('Register request received:', req.body);
  
  const { email, password, firstName, lastName, phone } = req.body;
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email);
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists'
    });
  }
  
  // Add new user
  const newUser = {
    id: users.length + 1,
    email,
    password,
    firstName,
    lastName,
    phone
  };
  
  users.push(newUser);
  
  console.log('Registration successful for:', email);
  
  res.json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone
      }
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Test server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`Available on network: http://10.208.159.195:${PORT}`);
  console.log(`Available for Android emulator: http://10.0.2.2:${PORT}`);
});