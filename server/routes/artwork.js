const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const upload = require('../config/upload');

// Get all artwork requests
router.get('/', async (req, res) => {
    try {
        // Get date filter from query params or default to last 30 days
        const daysAgo = req.query.days || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(daysAgo));
        // Format date as YYYY-MM-DD for Caspio REST API
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // Sort by Status, then Due_Date (earliest first), then ID_Design (newest first)
        const sortOrder = encodeURIComponent(`
            CASE Status 
                WHEN 'In Progress' THEN 1 
                WHEN 'Awaiting Approval' THEN 2 
                WHEN 'Completed' THEN 3 
                ELSE 4 
            END,
            CASE WHEN Due_Date IS NULL THEN 1 ELSE 0 END,
            Due_Date ASC,
            ID_Design DESC
        `.replace(/\s+/g, ' ').trim());
        // Get records with ID_Design > 52000, sorted by status and ID_Design
        const whereClause = encodeURIComponent('ID_Design > 52000');
        const url = `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records?q.where=${whereClause}&q.sort=${sortOrder}`;
        console.log('Request details:', {
            API_BASE_URL: process.env.API_BASE_URL,
            ART_TABLE_NAME: process.env.ART_TABLE_NAME,
            sortOrder: 'Status, then Due_Date ASC (nulls last), then ID_Design DESC',
            filter: 'ID_Design > 52000',
            fullUrl: url
        });
        console.log('Using token:', req.caspioToken);
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${req.caspioToken}`,
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Raw API Response:', JSON.stringify(response.data, null, 2));
        
        if (!response.data || !response.data.Result) {
            console.warn('Invalid response format:', response.data);
            return res.status(500).json({ error: 'Invalid response format from Caspio API' });
        }
        
        console.log('Number of records:', response.data.Result.length);
        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error fetching artwork:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method,
                headers: error.config?.headers
            });

            // Check for specific error cases
            if (error.response?.status === 401) {
                return res.status(401).json({ 
                    error: 'Authentication failed', 
                    details: 'Invalid or expired token'
                });
            }
            if (error.response?.status === 404) {
                return res.status(404).json({ 
                    error: 'Not found', 
                    details: 'The requested resource was not found'
                });
            }
        } else {
            console.error('Error fetching artwork:', error.message);
        }

        res.status(500).json({ 
            error: 'Failed to fetch artwork', 
            details: error.response?.data?.Message || error.message,
            url: `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records`
        });
    }
});

// Create new artwork request
router.post('/', async (req, res) => {
    try {
        const response = await axios.post(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records`,
            req.body,
            {
                headers: {
                'Authorization': `Bearer ${req.caspioToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error creating artwork:', error);
        res.status(500).json({ error: 'Failed to create artwork' });
    }
});

// Update artwork status
router.put('/:id', async (req, res) => {
    try {
        const response = await axios.put(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records?q.where=ID_Design=${req.params.id}`,
            req.body,
            {
                headers: {
                    'Authorization': `Bearer ${req.caspioToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error updating artwork:', error);
        res.status(500).json({ error: 'Failed to update artwork' });
    }
});

// Delete artwork request
router.delete('/:id', async (req, res) => {
    try {
        await axios.delete(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records?q.where=ID_Design=${req.params.id}`,
            {
                headers: {
                'Authorization': `Bearer ${req.caspioToken}`,
                'Accept': 'application/json'
                }
            }
        );
        res.json({ message: 'Artwork deleted successfully' });
    } catch (error) {
        console.error('Error deleting artwork:', error);
        res.status(500).json({ error: 'Failed to delete artwork' });
    }
});

// Get artwork image
router.get('/:id/image', async (req, res) => {
    try {
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/attachments/File_Upload_One/${req.params.id}`,
            {
                headers: {
                'Authorization': `Bearer ${req.caspioToken}`,
                'Accept': 'application/json'
                },
                responseType: 'stream'
            }
        );
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching artwork image:', error);
        res.status(500).json({ error: 'Failed to fetch artwork image' });
    }
});

// Upload artwork image
router.put('/:id/image', upload.single('File'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('File', fs.createReadStream(req.file.path));

        const response = await axios.put(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/attachments/File_Upload_One/${req.params.id}`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${req.caspioToken}`,
                    ...formData.getHeaders()
                }
            }
        );

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        res.json({ message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading artwork image:', error);
        res.status(500).json({ error: 'Failed to upload artwork image' });
    }
});

module.exports = router;
