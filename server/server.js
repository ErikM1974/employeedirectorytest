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

// Create uploads directory with absolute path
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure uploads directory has proper permissions
try {
  fs.chmodSync(uploadDir, 0o777);
} catch (err) {
  console.error('Failed to set upload directory permissions:', err);
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Sanitize filename
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      cb(null, `${Date.now()}-${sanitizedName}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

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
    const result = await tokenManager.handleRequest(async () => {
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
          const employee = createResponse.data.Result[0];
          console.log('Created employee:', employee);
          return employee;
        }

        // If no result in create response, try to get the newly created record
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
          const employee = getResponse.data.Result[0];
          console.log('Retrieved employee:', employee);
          return employee;
        }

        throw new Error('Failed to create employee: No record found');
      } catch (error) {
        console.error('Error creating employee:', error.response?.data || error.message);
        throw error;
      }
    });

    // Ensure we have an ID before sending response
    if (!result.ID_Employee) {
      console.error('Missing ID_Employee in result:', result);
      return res.status(500).json({ error: 'Server error: Missing employee ID in response' });
    }

    return res.json(result);
  } catch (error) {
    console.error('POST employees error:', error.message);
    return res.status(500).json({ error: error.message });
  }
});

// UPLOAD employee image
app.put('/api/employees/:pk/image', (req, res) => {
  console.log('Upload request received');
  console.log('Headers:', req.headers);
  console.log('Files:', req.files);
  console.log('Body:', req.body);
  
  upload.single('File')(req, res, async (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      return res.status(400).json({ error: err.message });
    }

    try {
      const { pk } = req.params;

      if (!req.file) {
        console.error('No file in request');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('Starting image upload for employee:', pk);
      console.log('File details:', {
        path: req.file.path,
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname
      });

      const url = `${API_BASE_URL}/tables/${TABLE_NAME}/attachments/Image/${pk}`;
      console.log('Upload URL:', url);

      const response = await tokenManager.handleRequest(async () => {
        const form = new FormData();
        const fileStream = fs.createReadStream(req.file.path);
        
        fileStream.on('error', (error) => {
          console.error('File stream error:', error);
          throw error;
        });

        form.append('File', fileStream, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });

        console.log('Form data headers:', form.getHeaders());

        const config = await tokenManager.createAuthenticatedRequest({
          method: 'put',
          url,
          headers: {
            ...form.getHeaders(),
            'Accept': 'application/json'
          },
          data: form,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 30000 // 30 second timeout
        });

        console.log('Request config:', {
          method: config.method,
          url: config.url,
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
      // Return default image path instead of 404 error
      return res.redirect('https://cdn.caspio.com/A0E15000/Safety%20Stripes/NWCA%20Favicon%20for%20TEAMNWCA.com.png?ver=1');
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
