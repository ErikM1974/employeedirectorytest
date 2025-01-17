require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const tokenManager = require('./auth/caspioAuth');

// Create a test directory if it doesn't exist
const TEST_DIR = path.join(__dirname, 'test-images');

async function getArtworkWithImages() {
    try {
        // Get a valid token using the TokenManager
        const token = await tokenManager.getToken();
        console.log('Successfully got token');

        // First get an artwork record that has images
        const artworkResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/${process.env.ART_TABLE_NAME}/records`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (!artworkResponse.data.Result || artworkResponse.data.Result.length === 0) {
            throw new Error('No artwork records found');
        }

        // Find first record with at least one image
        const artwork = artworkResponse.data.Result.find(art => 
            art.File_Upload_One || art.File_Upload_Two || 
            art.File_Upload_Three || art.File_Upload_Four
        );

        if (!artwork) {
            throw new Error('No artwork with images found');
        }

        console.log('\nTesting artwork record:', {
            ID_Design: artwork.ID_Design,
            CompanyName: artwork.CompanyName,
            File_Upload_One: artwork.File_Upload_One,
            File_Upload_Two: artwork.File_Upload_Two,
            File_Upload_Three: artwork.File_Upload_Three,
            File_Upload_Four: artwork.File_Upload_Four,
            PK_ID: artwork.PK_ID
        });

        // Create test directory
        await fs.mkdir(TEST_DIR, { recursive: true });

        // Test each image field
        for (let i = 1; i <= 4; i++) {
            const fieldName = `File_Upload_${['One', 'Two', 'Three', 'Four'][i-1]}`;
            const filePath = artwork[fieldName];
            
            if (!filePath) {
                console.log(`\nSkipping ${fieldName} - No file uploaded`);
                continue;
            }

            console.log(`\nTesting ${fieldName}:`);
            console.log('File path:', filePath);

            try {
                // Try different Caspio endpoints
                const endpoints = [
                    // Try direct file download
                    `/tables/${process.env.ART_TABLE_NAME}/files/${fieldName}/${artwork.ID_Design}`,
                    // Try attachment download
                    `/tables/${process.env.ART_TABLE_NAME}/records/${artwork.ID_Design}/files/${fieldName}`,
                    // Try with PK_ID
                    `/tables/${process.env.ART_TABLE_NAME}/files/${fieldName}/${artwork.PK_ID}`,
                    // Try blob storage
                    `/files/${process.env.ART_TABLE_NAME}/${artwork.ID_Design}/${fieldName}/${encodeURIComponent(filePath.split('/').pop())}`,
                    // Try direct file path
                    `/files${encodeURIComponent(filePath)}`
                ];

                for (let endpoint of endpoints) {
                    console.log('\nTrying endpoint:', endpoint);
                    
                    try {
                        const response = await axios.get(
                            `${process.env.API_BASE_URL}${endpoint}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': '*/*'
                                },
                                responseType: 'arraybuffer',
                                validateStatus: status => status < 500 // Don't throw on 4xx errors
                            }
                        );

                        console.log('Response status:', response.status);
                        console.log('Response headers:', response.headers);

                        if (response.status === 200) {
                            // Save the image
                            const filename = filePath.split('/').pop();
                            const savePath = path.join(TEST_DIR, `${artwork.ID_Design}_${fieldName}_${filename}`);
                            await fs.writeFile(savePath, response.data);
                            console.log('Image saved to:', savePath);
                            
                            // Get file info
                            const stats = await fs.stat(savePath);
                            console.log('File size:', Math.round(stats.size / 1024), 'KB');
                            console.log('✓ Success with endpoint:', endpoint);

                            // Try to determine file type
                            const fileSignature = response.data.slice(0, 4).toString('hex');
                            console.log('File signature:', fileSignature);
                            
                            break; // Stop trying endpoints if one succeeds
                        } else {
                            console.log('× Failed with status:', response.status);
                            if (response.headers['content-type']?.includes('json')) {
                                const textData = Buffer.from(response.data).toString('utf8');
                                try {
                                    const jsonData = JSON.parse(textData);
                                    console.log('Response data:', jsonData);
                                } catch (e) {
                                    console.log('Response text:', textData);
                                }
                            }
                        }
                    } catch (error) {
                        console.log('× Error:', {
                            status: error.response?.status,
                            statusText: error.response?.statusText,
                            data: error.response?.data?.toString()
                        });
                    }
                }
            } catch (error) {
                console.error(`Error testing ${fieldName}:`, error.message);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

// Run the test
console.log('Starting image retrieval test...');
getArtworkWithImages().catch(console.error);
