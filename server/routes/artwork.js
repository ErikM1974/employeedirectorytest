const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../config/upload');

// Get all artwork requests
router.get('/', async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    'Authorization': `bearer ${req.caspioToken}`,
                    'Accept': 'application/json'
                }
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching artwork:', error);
        res.status(500).json({ error: 'Failed to fetch artwork' });
    }
});

// Create new artwork request
router.post('/', async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `bearer ${req.caspioToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(req.body)
            }
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error creating artwork:', error);
        res.status(500).json({ error: 'Failed to create artwork' });
    }
});

// Update artwork status
router.put('/:id', async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${req.params.id}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `bearer ${req.caspioToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(req.body)
            }
        );
        res.status(200).json({ message: 'Artwork updated successfully' });
    } catch (error) {
        console.error('Error updating artwork:', error);
        res.status(500).json({ error: 'Failed to update artwork' });
    }
});

// Delete artwork request
router.delete('/:id', async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${req.params.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `bearer ${req.caspioToken}`
                }
            }
        );
        res.status(200).json({ message: 'Artwork deleted successfully' });
    } catch (error) {
        console.error('Error deleting artwork:', error);
        res.status(500).json({ error: 'Failed to delete artwork' });
    }
});

// Get artwork image
router.get('/:id/image', async (req, res) => {
    try {
        const response = await fetch(
            `${process.env.API_BASE_URL}/tables/ArtRequests/attachments/File_Upload_One/${req.params.id}`,
            {
                headers: {
                    'Authorization': `bearer ${req.caspioToken}`,
                    'Accept': '*/*'
                }
            }
        );
        
        if (response.ok) {
            response.body.pipe(res);
        } else {
            res.redirect('/placeholder-image.png');
        }
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
        formData.append('File', fs.createReadStream(req.file.path), {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await fetch(
            `${process.env.API_BASE_URL}/tables/ArtRequests/attachments/File_Upload_One/${req.params.id}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `bearer ${req.caspioToken}`,
                    ...formData.getHeaders()
                },
                body: formData
            }
        );

        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        res.status(200).json({ message: 'Image uploaded successfully' });
    } catch (error) {
        console.error('Error uploading artwork image:', error);
        res.status(500).json({ error: 'Failed to upload artwork image' });
    }
});

module.exports = router;
