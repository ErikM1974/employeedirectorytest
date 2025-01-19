const express = require('express');
const router = express.Router();
const axios = require('axios');
const tokenManager = require('../auth/caspioAuth');

// Get all artwork requests with file metadata
router.get('/requests', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        const page = parseInt(req.query.page) || 1;
        
        // Get artwork requests with pagination and sorting
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                },
                params: {
                    'q.orderBy': 'Date_Created DESC',
                    'q.limit': 200,
                    'q.pageSize': 20,
                    'q.pageNumber': page
                }
            }
        );

        console.log('Raw records from Caspio:', response.data.Result.slice(0, 1));

        // Add file metadata to each record
        const records = response.data.Result.map(record => {
            const fileFields = ['File_Upload_One', 'File_Upload_Two', 'File_Upload_Three', 'File_Upload_Four'];
            const processedRecord = { ...record };
            
            // Process each file field
            fileFields.forEach(field => {
                if (record[field]) {
                    // Remove any leading slashes and clean the path
                    const cleanPath = record[field].replace(/^\/+/, '');
                    processedRecord[field] = cleanPath;
                    console.log(`Processing ${field}:`, {
                        original: record[field],
                        cleaned: cleanPath
                    });
                }
            });

            return processedRecord;
        });

        res.json(records);
    } catch (error) {
        console.error('Error fetching artwork requests:', error);
        res.status(500).json({ error: 'Failed to fetch artwork requests' });
    }
});

// Get file content by file path with caching
router.get('/file/:filePath(*)', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        const { filePath } = req.params;

        console.log('File request:', {
            originalPath: filePath,
            cleanedPath: filePath.startsWith('/') ? filePath : `/${filePath}`,
            token: token?.substring(0, 20) + '...'
        });

        // Set caching headers
        res.set({
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'ETag': Buffer.from(filePath).toString('base64')
        });

        // Check if browser has cached version
        const ifNoneMatch = req.get('If-None-Match');
        if (ifNoneMatch === Buffer.from(filePath).toString('base64')) {
            return res.status(304).end();
        }

        // Get file using the path endpoint - match Swagger format exactly
        const filePathWithSlash = filePath.startsWith('/') ? filePath : `/${filePath}`;
        const fileResponse = await axios.get(
            `${process.env.API_BASE_URL}/files/path?filePath=${encodeURIComponent(filePathWithSlash)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/octet-stream'
                },
                responseType: 'arraybuffer'
            }
        );

        // Set content type and other headers
        res.set({
            'Content-Type': fileResponse.headers['content-type'],
            'Content-Disposition': `inline; filename=${encodeURIComponent(filePath.split('/').pop())}`,
            'Content-Length': fileResponse.data.length
        });

        // Send the file
        res.send(fileResponse.data);

    } catch (error) {
        console.error('Error serving file:', error);
        if (error.response?.status === 404) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// Update artwork status
router.put('/status/:id', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        const { id } = req.params;
        const { status } = req.body;

        console.log('Updating status:', { id, status });

        // Update using exact format from Swagger test
        const updateResponse = await axios.put(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            { Status: status },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                params: {
                    'q.where': `ID_Design=${id}`
                }
            }
        );

        console.log('Update response:', updateResponse.data);

        if (updateResponse.data.RecordsAffected === 1) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Record not found or not updated' });
        }

    } catch (error) {
        console.error('Error updating artwork status:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to update status' });
    }
});

module.exports = router;
