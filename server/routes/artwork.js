const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const upload = require('../config/upload');

// Get artwork requests with search and sort
router.get('/', async (req, res) => {
    try {
        const { 
            company,         // CompanyName search
            status,         // Status filter
            rep,            // CustomerServiceRep filter
            dateFrom,       // Date_Created range start
            dateTo,         // Date_Created range end
            idFrom,         // ID_Design range start
            idTo,           // ID_Design range end
            sortBy = 'ID_Design',  // Default sort field
            sortDir = 'desc'       // Default sort direction
        } = req.query;

        // Build where conditions
        let whereConditions = [];
        
        // Company name - partial match using LIKE
        if (company) {
            whereConditions.push(`CompanyName LIKE '%${company}%'`);
        }
        
        // Status - exact match
        if (status) {
            whereConditions.push(`Status LIKE '${status}%'`); // Match start of status text
        }
        
        // User Email search
        if (rep) {
            whereConditions.push(`User_Email = '${rep}'`);
        }
        
        // Date range
        if (dateFrom && dateTo) {
            whereConditions.push(`Date_Created BETWEEN '${dateFrom}' AND '${dateTo}'`);
        }
        
        // ID range
        if (idFrom && idTo) {
            whereConditions.push(`ID_Design BETWEEN ${idFrom} AND ${idTo}`);
        }

        // Show all records by default
        if (whereConditions.length === 0) {
            whereConditions.push('ID_Design > 0');
        }

        // Combine conditions
        const whereClause = encodeURIComponent(whereConditions.join(' AND '));

        // Build sort order
        const validSortFields = ['ID_Design', 'CompanyName', 'Status', 'Date_Created', 'Due_Date', 'User_Email'];
        const validSortDirs = ['asc', 'desc'];
        
        // Validate sort parameters
        const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'ID_Design';
        const finalSortDir = validSortDirs.includes(sortDir.toLowerCase()) ? sortDir.toLowerCase() : 'desc';
        
        const sortOrder = encodeURIComponent(`${finalSortBy} ${finalSortDir}`);
        
        // Build URL with search and sort
        const url = `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records?q.where=${whereClause}&q.sort=${sortOrder}`;
        
        // Log search parameters and constructed query
        console.log('Search Parameters:', {
            company: company || 'not specified',
            status: status || 'not specified',
            rep: rep || 'not specified',
            dateRange: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'not specified',
            idRange: idFrom && idTo ? `${idFrom} to ${idTo}` : 'not specified',
            sorting: `${finalSortBy} ${finalSortDir}`
        });
        
        console.log('Query Details:', {
            whereClause: decodeURIComponent(whereClause),
            sortOrder: decodeURIComponent(sortOrder),
            fullUrl: url
        });
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${req.caspioToken}`,
                'Accept': 'application/json'
            }
        });
        
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
        // First check if the artwork exists and has an image
        const artworkResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records?q.where=ID_Design=${req.params.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${req.caspioToken}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!artworkResponse.data.Result || artworkResponse.data.Result.length === 0) {
            return res.status(404).json({ message: 'Artwork not found' });
        }

        const artwork = artworkResponse.data.Result[0];
        if (!artwork.File_Upload_One) {
            return res.status(404).json({ message: 'No image available for this artwork' });
        }

        // Now fetch the image
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/attachments/File_Upload_One?q.where=ID_Design=${req.params.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${req.caspioToken}`,
                    'Accept': '*/*'
                },
                responseType: 'stream'
            }
        );

        // Forward content type
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }

        // Stream the image
        response.data.pipe(res);
    } catch (error) {
        console.error('Error fetching image:', error);
        if (error.response?.status === 404) {
            res.status(404).json({ message: 'Image not found' });
        } else {
            res.status(500).json({ message: 'Error fetching image' });
        }
    }
});

// Upload artwork image
router.put('/:id/image', upload.single('File'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const formData = new FormData();
        formData.append('File', fs.createReadStream(req.file.path));

        const response = await axios.put(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/attachments/File_Upload_One?q.where=ID_Design=${req.params.id}`,
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
