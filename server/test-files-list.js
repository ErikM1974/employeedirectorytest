require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testFilesList() {
    try {
        console.log('Getting token...');
        const token = await tokenManager.getToken();
        console.log('Token received:', token ? 'Yes' : 'No');

        console.log('\nFetching files list...');
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
        console.log('\nFiles found:', files.length);
        console.log('\nFile names:');
        files.forEach(f => {
            console.log(`- ${f.Name} (${f.ContentType}, ${Math.round(f.Size/1024)}KB)`);
        });

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
        console.log('\nFile fields in requests:');
        records.forEach(record => {
            console.log(`\nRequest ID: ${record.ID_Design}`);
            ['File_Upload_One', 'File_Upload_Two', 'File_Upload_Three', 'File_Upload_Four'].forEach(field => {
                if (record[field]) {
                    console.log(`- ${field}: ${record[field]}`);
                }
            });
        });

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Starting files test...\n');
testFilesList().catch(console.error);
