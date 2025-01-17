require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tokenManager = require('./auth/caspioAuth');

async function getRecordStructure() {
    try {
        // Get a valid token
        const token = await tokenManager.getToken();
        console.log('Successfully got token');

        // Get specific record with ID_Design = 51420
        console.log('\nGetting specific artwork record...');
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=51420`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (response.data && response.data.Result && response.data.Result[0]) {
            const record = response.data.Result[0];
            console.log('\nFound record:');
            console.log('ID_Design:', record.ID_Design);
            console.log('CompanyName:', record.CompanyName);
            console.log('File paths:');
            ['One', 'Two', 'Three', 'Four'].forEach(num => {
                const field = `File_Upload_${num}`;
                console.log(`${field}:`, record[field] || 'none');
            });

            // Use the exact Swagger endpoint format
            const endpoints = ['One', 'Two', 'Three', 'Four'].map(num => ({
                field: `File_Upload_${num}`,
                endpoint: `/tables/ArtRequests/attachments/File_Upload_${num}/${record.ID_Design}`
            }));

            console.log('\nTesting file endpoints using Swagger format...');
            for (const { field, endpoint } of endpoints) {
                if (!record[field]) {
                    console.log(`\nSkipping ${field} - No file uploaded`);
                    continue;
                }

                console.log(`\nTrying endpoint for ${field}:`, endpoint);
                try {
                    const fileResponse = await axios.get(
                        `${process.env.API_BASE_URL}${endpoint}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': '*/*'
                            },
                            validateStatus: null,
                            responseType: 'arraybuffer'
                        }
                    );
                    console.log('Response status:', fileResponse.status);
                    console.log('Response headers:', fileResponse.headers);
                    
                    if (fileResponse.status === 200) {
                        const buffer = Buffer.from(fileResponse.data);
                        console.log('Content length:', buffer.length);
                        
                        if (fileResponse.headers['content-type']) {
                            console.log('Content-Type:', fileResponse.headers['content-type']);
                        }

                        // Save the file with its original name from the record
                        const originalName = record[field].split('/').pop();
                        const savePath = path.join(__dirname, 'test-images', `${record.ID_Design}_${field}_${originalName}`);
                        await fs.promises.mkdir(path.join(__dirname, 'test-images'), { recursive: true });
                        await fs.promises.writeFile(savePath, buffer);
                        console.log('✓ Saved file to:', savePath);
                    } else if (fileResponse.headers['content-type']?.includes('json')) {
                        const textData = Buffer.from(fileResponse.data).toString('utf8');
                        try {
                            const jsonData = JSON.parse(textData);
                            console.log('Response data:', jsonData);
                        } catch (e) {
                            console.log('Response text:', textData);
                        }
                    }
                } catch (fileError) {
                    console.log('Error:', fileError.message);
                    if (fileError.response?.data) {
                        try {
                            const errorText = Buffer.from(fileError.response.data).toString('utf8');
                            console.log('Error response:', errorText);
                        } catch (e) {
                            console.log('Raw error data:', fileError.response.data);
                        }
                    }
                }
            }
        } else {
            console.log('Record not found');
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
console.log('Getting specific artwork record...');
getRecordStructure().catch(console.error);
