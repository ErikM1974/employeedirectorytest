require('dotenv').config({ path: '.env.development' });
const express = require('express');
const cors = require('cors');
const artworkRoutes = require('./routes/artwork');
const employeeRoutes = require('./routes/employees');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/artwork', artworkRoutes);
app.use('/api/employees', employeeRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Base URL:', process.env.API_BASE_URL);
});
