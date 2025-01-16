//////////////////////////////////////////////////////////////
// server.js - Node/Express Backend for Caspio Drag & Drop
//////////////////////////////////////////////////////////////

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
// Using environment variables from .env file
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
const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/') // Ensure this directory exists
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// -------------------------------------------------------
// 4) Routes
// -------------------------------------------------------

// GET all employees
app.get('/api/employees', async (req, res) => {
  try {
    const url = `${API_BASE_URL}/tables/${TABLE_NAME}/records`;
    
    const { data } = await tokenManager.handleRequest(async () => {
      const config = await tokenManager.createAuthenticatedRequest({
        method: 'get',
        url,
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        }
      });
      
      return axios(config);
    });
    // data.Result is an array of employee objects
    return res.json(data.Result);
  } catch (error) {
    console.error('GET employees error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      console.error('Request headers:', error.config.headers);
    }
    return res.status(500).json({ error: error.message });
  }
});

// CREATE new employee
app.post('/api/employees', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { EmployeeName, Department, StartDate } = req.body;
    
    if (!EmployeeName || !Department) {
      return res.status(400).json({ error: 'EmployeeName and Department are required' });
    }

    const url = `${API_BASE_URL}/tables/${TABLE_NAME}/records`;
    const { data } = await tokenManager.handleRequest(async () => {
      try {
        // Create employee record
        const createConfig = await tokenManager.createAuthenticatedRequest({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          data: {
            EmployeeName: EmployeeName.trim(),
            Department: Department.trim(),
            StartDate: StartDate || null
          }
        });

        console.log('Creating employee with config:', {
          url: createConfig.url,
          method: createConfig.method,
          headers: createConfig.headers,
          data: createConfig.data
        });

        const createResponse = await axios(createConfig);
        console.log('Create response:', createResponse.data);

        // Check if Caspio returned an error
        if (createResponse.data?.Message) {
          throw new Error(`Caspio error: ${createResponse.data.Message}`);
        }

        // If successful, return the created record
        if (createResponse.data?.Result?.[0]) {
          return createResponse.data.Result[0];
        }

        // If no result, try to get the newly created record
        const getConfig = await tokenManager.createAuthenticatedRequest({
          method: 'get',
          url,
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          params: {
            'q.where': `EmployeeName='${EmployeeName.trim()}'`,
            'q.sort': 'DateCreated DESC',
            'q.limit': 1
          }
        });

        const getResponse = await axios(getConfig);
        console.log('Get response:', getResponse.data);

        if (getResponse.data?.Result?.[0]) {
          return getResponse.data.Result[0];
        }

        throw new Error('Failed to create employee: No record found');
      } catch (error) {
        console.error('Error creating employee:', error.response?.data || error.message);
        throw error;
      }
    });
    return res.json(data);
  } catch (error) {
    console.error('POST employees error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Update file info
app.put('/api/employees/:pk/image/fileinfo', async (req, res) => {
  try {
    const { pk } = req.params;
    const { FileName } = req.body;

    console.log('Updating file info for employee:', pk);
    console.log('File name:', FileName);

    // First, update the record with the filename
    const recordUrl = `${API_BASE_URL}/tables/${TABLE_NAME}/records`;
    const response = await tokenManager.handleRequest(async () => {
      const config = await tokenManager.createAuthenticatedRequest({
        method: 'put',
        url: recordUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        data: {
          Image: FileName
        },
        params: {
          'q.where': `ID_Employee=${pk}`
        }
      });
      
      return axios(config);
    });

    console.log('File info update response:', response.data);
    return res.json({ success: true });
  } catch (error) {
    console.error('Update file info error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    return res.status(500).json({ error: error.message });
  }
});

// UPLOAD employee image
app.put('/api/employees/:pk/image', upload.single('File'), async (req, res) => {
  try {
    const { pk } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const url = `${API_BASE_URL}/tables/${TABLE_NAME}/attachments/Image/${pk}`;

    console.log('Starting image upload for employee:', pk);
    console.log('File details:', {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      size: req.file.size
    });

    const response = await tokenManager.handleRequest(async () => {
      const form = new FormData();
      form.append('File', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const config = await tokenManager.createAuthenticatedRequest({
        method: 'put',
        url,
        headers: {
          ...form.getHeaders(),
          'Accept': 'application/json'
        },
        data: form,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      console.log('Uploading image with config:', {
        url: config.url,
        method: config.method,
        headers: config.headers
      });
      
      return axios(config);
    });

    console.log('Upload response:', response.data);

    // Clean up: delete the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Upload error details:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    }

    // Clean up temp file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }

    return res.status(500).json({ 
      error: error.message,
      details: error.response?.data || 'No additional details'
    });
  }
});

// UPDATE employee by ID_Employee
app.put('/api/employees/:pk', async (req, res) => {
  try {
    const { pk } = req.params;
    const { Department, EmployeeName, StartDate } = req.body;

    const url = `${API_BASE_URL}/tables/${TABLE_NAME}/records`;

    const updateData = {};
    if (Department) updateData.Department = Department;
    if (EmployeeName) updateData.EmployeeName = EmployeeName;
    if (StartDate !== undefined) updateData.StartDate = StartDate;

    const { data } = await tokenManager.handleRequest(async () => {
      const config = await tokenManager.createAuthenticatedRequest({
        method: 'put',
        url,
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        params: {
          'q.where': `ID_Employee=${pk}`
        },
        data: updateData
      });
      
      return axios(config);
    });

    console.log('Update response:', data);

    // Return success response
    return res.json({
      ID_Employee: pk,
      Department: Department,
      success: true
    });
  } catch (error) {
    console.error('PUT employees error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      console.error('Request URL:', error.config.url);
      console.error('Request headers:', error.config.headers);
      console.error('Request data:', JSON.stringify(error.config.data, null, 2));
    }
    return res.status(500).json({ 
      error: error.message,
      details: error.response?.data 
    });
  }
});

// GET employee image
app.get('/api/employees/:pk/image', async (req, res) => {
  try {
    const { pk } = req.params;
    const url = `${API_BASE_URL}/tables/${TABLE_NAME}/attachments/Image/${pk}`;
    
    const response = await tokenManager.handleRequest(async () => {
      const config = await tokenManager.createAuthenticatedRequest({
        method: 'get',
        url,
        headers: {
          'accept': '*/*'
        },
        responseType: 'stream',
        validateStatus: function (status) {
          return status >= 200 && status < 300 || status === 404;
        }
      });
      
      return axios(config);
    });

    if (response.status === 404) {
      // If image not found, return default image or 404
      return res.status(404).json({ error: 'Image not found' });
    }

    // Set proper content type header based on response
    res.set('Content-Type', response.headers['content-type']);
    
    // Forward the image stream to client
    response.data.pipe(res);
  } catch (error) {
    console.error('GET image error:', error.message);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      return res.status(error.response.status).json({ 
        error: error.message,
        details: error.response.data
      });
    }
    return res.status(500).json({ error: error.message });
  }
});

// DELETE employee
app.delete('/api/employees/:pk', async (req, res) => {
  try {
    const { pk } = req.params;
    const url = `${API_BASE_URL}/tables/${TABLE_NAME}/records`;
    
    const { data } = await tokenManager.handleRequest(async () => {
      const config = await tokenManager.createAuthenticatedRequest({
        method: 'delete',
        url,
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        params: {
          'q.where': `ID_Employee=${pk}`
        }
      });
      
      return axios(config);
    });
    return res.json(data);
  } catch (error) {
    console.error('DELETE employees error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

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
// 4) Start Server
// -------------------------------------------------------
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Backend listening on http://localhost:${PORT}`);
  }
});
