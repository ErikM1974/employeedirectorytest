require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testFileAccess() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // Test file to access
        const testFile = 'BABY PIC.JPG';

        // 2. Try different URL structures
        const urls = [
            // Direct file access
            {
                name: 'Direct REST API',
                url: `${process.env.API_BASE_URL}/files/Artwork/${testFile}`
            },
            // CDN URL with authentication
            {
                name: 'CDN with Auth',
                url: `https://cdn.caspio.com/A0E15000B/Artwork/${testFile}`
            },
            // Legacy file access
            {
                name: 'Legacy API',
                url: `https://c3eku948.caspio.com/files/Artwork/${testFile}`
            }
        ];

        // 3. Test each URL
        for (const { name, url } of urls) {
            console.log(`\nTesting ${name}:`);
            console.log('URL:', url);
            
            try {
                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: '*/*'
                    },
                    responseType: 'arraybuffer'
                });

                console.log('Success!');
                console.log('Content Type:', response.headers['content-type']);
                console.log('Content Length:', Math.round(response.data.length / 1024), 'KB');
            } catch (error) {
                console.error('Failed:', error.message);
                if (error.response) {
                    console.error('Status:', error.response.status);
                    console.error('Headers:', error.response.headers);
                    try {
                        const textData = Buffer.from(error.response.data).toString('utf8');
                        console.error('Response:', textData);
                    } catch (e) {
                        console.error('Raw response data:', error.response.data);
                    }
                }
            }
        }

        // 4. Try without authentication
        console.log('\nTesting CDN without authentication:');
        try {
            const response = await axios.get(
                `https://cdn.caspio.com/A0E15000B/Artwork/${testFile}`,
                {
                    responseType: 'arraybuffer'
                }
            );
            console.log('Success! (No auth needed)');
            console.log('Content Type:', response.headers['content-type']);
            console.log('Content Length:', Math.round(response.data.length / 1024), 'KB');
        } catch (error) {
            console.error('Failed:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Headers:', error.response.headers);
            }
        }

    } catch (error) {
        console.error('\nError:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Testing file access...');
testFileAccess().catch(console.error);
