require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testFilePath() {
    try {
        console.log('Getting token...');
        const token = await tokenManager.getToken();
        console.log('Token received:', token ? 'Yes' : 'No');

        // Test file path
        const testPath = '/Artwork/Zip Zip Trucking.jpg';
        console.log('\nTesting file path:', testPath);

        // Get file using path endpoint
        const fileResponse = await axios.get(
            `${process.env.API_BASE_URL}/files/path`,
            {
                params: {
                    filePath: testPath
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/octet-stream'
                },
                responseType: 'arraybuffer'
            }
        );

        // Log response details
        console.log('\nFile found!');
        console.log('Content Type:', fileResponse.headers['content-type']);
        console.log('Filename:', fileResponse.headers['filename']);
        console.log('Size:', Math.round(fileResponse.data.length / 1024), 'KB');

        // Try another file
        const testPath2 = '/Artwork/chisholm Minnesota.png';
        console.log('\nTesting another file path:', testPath2);

        const fileResponse2 = await axios.get(
            `${process.env.API_BASE_URL}/files/path`,
            {
                params: {
                    filePath: testPath2
                },
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/octet-stream'
                },
                responseType: 'arraybuffer'
            }
        );

        console.log('\nSecond file found!');
        console.log('Content Type:', fileResponse2.headers['content-type']);
        console.log('Filename:', fileResponse2.headers['filename']);
        console.log('Size:', Math.round(fileResponse2.data.length / 1024), 'KB');

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            if (error.response.data instanceof Buffer) {
                console.error('Response data is binary (length:', error.response.data.length, 'bytes)');
            } else {
                console.error('Response data:', error.response.data);
            }
        }
    }
}

console.log('Starting file path test...\n');
testFilePath().catch(console.error);
