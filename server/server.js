const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const config = require('./config/config');

// Load environment variables based on NODE_ENV
require('dotenv').config({
  path: path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
});

const app = express();

// Configure CORS based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? config.clientUrl : 'http://localhost:3000',
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

// -------------------------------------------------------
// 2) Get Access Token
// -------------------------------------------------------
const tokenManager = require('./auth/caspioAuth');

// Only log environment variables in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment Variables:', {
    TOKEN_ENDPOINT: process.env.TOKEN_ENDPOINT,
    API_BASE_URL: process.env.API_BASE_URL,
    TABLE_NAME: process.env.TABLE_NAME
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
