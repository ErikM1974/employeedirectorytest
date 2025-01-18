const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const upload = require('../config/upload');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/records`,
      {
        headers: {
          'Authorization': `Bearer ${req.caspioToken}`
        }
      }
    );
    res.json(response.data.Result);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Update employee status
router.put('/:id', async (req, res) => {
  try {
    const response = await axios.put(
      `${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/records?q.where=ID_Employee=${req.params.id}`,
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
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Error updating employee' });
  }
});

// Upload employee image
router.put('/:id/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const response = await axios.put(
      `${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/attachments/Photo/${req.params.id}`,
      req.file.buffer,
      {
        headers: {
          'Authorization': `Bearer ${req.caspioToken}`,
          'Content-Type': 'application/octet-stream'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Get employee image
router.get('/:id/image', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/attachments/Photo/${req.params.id}`,
      {
        headers: {
          'Authorization': `Bearer ${req.caspioToken}`
        },
        responseType: 'stream'
      }
    );
    response.data.pipe(res);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Error fetching image' });
  }
});

module.exports = router;
