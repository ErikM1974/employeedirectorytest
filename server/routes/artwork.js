const express = require('express');
const router = express.Router();
const axios = require('axios');
const tokenManager = require('../auth/caspioAuth');

// Get all artwork requests with file metadata
router.get('/requests', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        
        // Get artwork requests
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        // Add file metadata to each record
        const records = response.data.Result.map(record => {
            const fileFields = {};
            ['File_Upload_One', 'File_Upload_Two', 'File_Upload_Three', 'File_Upload_Four'].forEach(field => {
                if (record[field]) {
                    fileFields[field] = {
                        path: record[field],
                        exists: true, // We'll verify this when fetching the file
                        metadata: {
                            contentType: 'image/jpeg', // Will be determined when fetching
                            filePath: record[field]
                        }
                    };
                } else {
                    fileFields[field] = null;
                }
            });

            return {
                ...record,
                ...fileFields
            };
        });

        res.json(records);
    } catch (error) {
        console.error('Error fetching artwork requests:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ error: 'Failed to fetch artwork requests' });
    }
});

// Get file content by file path
router.get('/file/:filePath(*)', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        const { filePath } = req.params;

        console.log('Fetching file:', filePath);

        // Get file using the path endpoint
        const fileResponse = await axios.get(
            `${process.env.API_BASE_URL}/files/path`,
            {
                params: {
                    filePath: `/${filePath}` // Ensure leading slash
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/octet-stream'
                },
                responseType: 'arraybuffer'
            }
        );

        // Get content type from response headers
        const contentType = fileResponse.headers['content-type'];
        const filename = fileResponse.headers['filename'];

        // Set appropriate headers
        res.set('Content-Type', contentType);
        res.set('Content-Disposition', `inline; filename="${filename}"`);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Send the file
        res.send(fileResponse.data);

    } catch (error) {
        console.error('Error serving file:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            if (error.response.data instanceof Buffer) {
                console.error('Response data is binary (length:', error.response.data.length, 'bytes)');
            } else {
                console.error('Response data:', error.response.data);
            }
        }
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
