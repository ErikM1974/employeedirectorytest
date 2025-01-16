const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const config = require('./config/config');

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
console.log('Loading environment from:', envFile);
require('dotenv').config({
  path: path.join(__dirname, envFile)
});

// Log environment variables in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Loaded environment variables:', {
    TOKEN_ENDPOINT: process.env.TOKEN_ENDPOINT,
    API_BASE_URL: process.env.API_BASE_URL,
    TABLE_NAME: process.env.TABLE_NAME,
    ART_TABLE_NAME: process.env.ART_TABLE_NAME,
    CASPIO_CLIENT_ID: process.env.CASPIO_CLIENT_ID?.substring(0, 10) + '...',
    CASPIO_CLIENT_SECRET: process.env.CASPIO_CLIENT_SECRET?.substring(0, 10) + '...'
  });
}

const app = express();

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? config.clientUrl : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests for all routes
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
  res.sendStatus(204);
});

// -------------------------------------------------------
// 1) Set Caspio Credentials & Endpoints
// -------------------------------------------------------
const TOKEN_ENDPOINT = process.env.TOKEN_ENDPOINT;
const API_BASE_URL = process.env.API_BASE_URL;
const TABLE_NAME = process.env.TABLE_NAME;
const ART_TABLE_NAME = process.env.ART_TABLE_NAME;

// -------------------------------------------------------
// 2) Get Access Token
// -------------------------------------------------------
const tokenManager = require('./auth/caspioAuth');

// Middleware to attach Caspio token to all requests
app.use(async (req, res, next) => {
  try {
    const token = await tokenManager.getToken();
    req.caspioToken = token;
    next();
  } catch (error) {
    console.error('Error getting Caspio token:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Only log environment variables in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment Variables:', {
    TOKEN_ENDPOINT: process.env.TOKEN_ENDPOINT,
    API_BASE_URL: process.env.API_BASE_URL,
    TABLE_NAME: process.env.TABLE_NAME,
    ART_TABLE_NAME: process.env.ART_TABLE_NAME
  });
}

// -------------------------------------------------------
// 3) Configure multer for file upload
// -------------------------------------------------------
const upload = require('./config/upload');

// Error handling middleware for multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({
      error: `File upload error: ${err.message}`,
      code: err.code
    });
  } else if (err) {
    console.error('Other error:', err);
    return res.status(500).json({
      error: err.message
    });
  }
  next();
});

// -------------------------------------------------------
// 4) Routes
// -------------------------------------------------------

// Import route handlers
const employeesRouter = require('./routes/employees');
const artworkRouter = require('./routes/artwork');

// Use route handlers
app.use('/api/employees', employeesRouter);
app.use('/api/artwork', artworkRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    }
  });
}

// -------------------------------------------------------
// 5) Start Server
// -------------------------------------------------------
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Backend listening on http://localhost:${PORT}`);
  }
});
