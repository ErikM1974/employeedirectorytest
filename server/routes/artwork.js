const express = require('express');
const router = express.Router();
const axios = require('axios');
const tokenManager = require('../auth/caspioAuth');

// Get all artwork requests with file metadata
router.get('/requests', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        
        // 1. Get files list first to map filenames to metadata
        const filesResponse = await axios.get(
            `${process.env.API_BASE_URL}/files`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const files = filesResponse.data?.Result?.Files || [];
        const fileMap = new Map(files.map(f => [f.Name, f]));

        // 2. Get artwork requests
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        // 3. Add file metadata to each record
        const records = response.data.Result.map(record => {
            const fileFields = {};
            ['File_Upload_One', 'File_Upload_Two', 'File_Upload_Three', 'File_Upload_Four'].forEach(field => {
                if (record[field]) {
                    const fileName = record[field].replace(/^\//, '').replace(/^Artwork\//, '');
                    const fileInfo = fileMap.get(fileName);
                    fileFields[field] = fileInfo ? {
                        path: fileName,
                        exists: true,
                        metadata: {
                            externalKey: fileInfo.ExternalKey,
                            contentType: fileInfo.ContentType,
                            size: fileInfo.Size,
                            dateCreated: fileInfo.DateCreated
                        }
                    } : {
                        path: fileName,
                        exists: false,
                        metadata: null
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
        res.status(500).json({ error: 'Failed to fetch artwork requests' });
    }
});

// Get file content by external key
router.get('/file/:externalKey', async (req, res) => {
    try {
        const token = await tokenManager.getToken();
        const { externalKey } = req.params;

        console.log('Fetching file:', externalKey);

        // Get file content using ExternalKey
        const fileResponse = await axios.get(
            `${process.env.API_BASE_URL}/files/${externalKey}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: '*/*'
                },
                responseType: 'arraybuffer'
            }
        );

        // Get file metadata to set correct headers
        const filesResponse = await axios.get(
            `${process.env.API_BASE_URL}/files`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const files = filesResponse.data?.Result?.Files || [];
        const fileInfo = files.find(f => f.ExternalKey === externalKey);

        if (!fileInfo) {
            console.error('File metadata not found:', externalKey);
            return res.status(404).json({ error: 'File not found' });
        }

        // Set appropriate headers
        res.set('Content-Type', fileInfo.ContentType);
        res.set('Content-Disposition', `inline; filename="${fileInfo.Name}"`);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.set('ETag', `"${fileInfo.ExternalKey}"`);

        // Send the file
        res.send(fileResponse.data);

    } catch (error) {
        console.error('Error serving file:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
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
