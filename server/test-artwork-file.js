require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testArtworkFile() {
    try {
        console.log('Getting token...');
        const token = await tokenManager.getToken();
        console.log('Token received:', token ? 'Yes' : 'No');

        // Get files list from Caspio
        console.log('\nFetching files from Caspio...');
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
        console.log('\nFiles in Caspio:', files.length);
        files.forEach(f => {
            console.log(`- ${f.Name} (${f.ContentType}, ${Math.round(f.Size/1024)}KB)`);
        });

        // Test specific file
        const testFile = '/Artwork/Zip Zip Trucking.jpg';
        console.log('\nTesting file:', testFile);

        // Create map with all possible variations
        const fileMap = new Map();
        files.forEach(f => {
            // Store original name
            fileMap.set(f.Name, f);
            
            // Store without Artwork/ prefix
            if (f.Name.startsWith('Artwork/')) {
                fileMap.set(f.Name.replace('Artwork/', ''), f);
            }
            
            // Store with Artwork/ prefix
            if (!f.Name.startsWith('Artwork/')) {
                fileMap.set(`Artwork/${f.Name}`, f);
            }

            // Store with /Artwork/ prefix
            if (!f.Name.startsWith('/Artwork/')) {
                fileMap.set(`/Artwork/${f.Name}`, f);
            }

            // Store without any prefix
            const cleanName = f.Name
                .replace(/^\/Artwork\//, '')
                .replace(/^Artwork\//, '');
            fileMap.set(cleanName, f);
        });

        // Clean up test filename
        const cleanFileName = testFile
            .replace(/^\//, '')  // Remove leading slash
            .replace(/^Artwork\//, ''); // Remove Artwork/ prefix

        // Try different variations
        const variations = [
            cleanFileName,
            `Artwork/${cleanFileName}`,
            `/Artwork/${cleanFileName}`,
            testFile,
            testFile.replace(/^\//, '')
        ];

        console.log('\nTrying variations:');
        variations.forEach(v => console.log(`- ${v}`));

        // Check each variation
        variations.forEach(v => {
            const match = fileMap.get(v);
            if (match) {
                console.log(`\nFound match for variation "${v}":`);
                console.log('File:', match.Name);
                console.log('Type:', match.ContentType);
                console.log('Size:', Math.round(match.Size/1024), 'KB');
                console.log('ExternalKey:', match.ExternalKey);
            }
        });

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Starting artwork file test...\n');
testArtworkFile().catch(console.error);
