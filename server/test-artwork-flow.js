require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testArtworkFlow() {
    try {
        console.log('Getting token...');
        const token = await tokenManager.getToken();
        console.log('Token received:', token ? 'Yes' : 'No');

        // 1. Get artwork requests
        console.log('\nFetching artwork requests...');
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const records = response.data.Result;
        console.log('\nArtwork requests found:', records.length);

        // 2. Test file access for each file in requests
        for (const record of records) {
            ['File_Upload_One', 'File_Upload_Two', 'File_Upload_Three', 'File_Upload_Four'].forEach(async (field) => {
                if (record[field]) {
                    console.log(`\nTesting ${field} for request ${record.ID_Design}:`, record[field]);
                    try {
                        const fileResponse = await axios.get(
                            `${process.env.API_BASE_URL}/files/path`,
                            {
                                params: {
                                    filePath: record[field]
                                },
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    Accept: 'application/octet-stream'
                                },
                                responseType: 'arraybuffer'
                            }
                        );

                        console.log('File found!');
                        console.log('Content Type:', fileResponse.headers['content-type']);
                        console.log('Filename:', fileResponse.headers['filename']);
                        console.log('Size:', Math.round(fileResponse.data.length / 1024), 'KB');
                    } catch (error) {
                        console.error('Error accessing file:', error.message);
                        if (error.response) {
                            console.error('Response status:', error.response.status);
                            if (error.response.status === 404) {
                                console.error('File not found in Caspio');
                            }
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Starting artwork flow test...\n');
testArtworkFlow().catch(console.error);
