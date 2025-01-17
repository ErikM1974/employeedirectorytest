require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tokenManager = require('./auth/caspioAuth');

async function testSpecificFile() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('Successfully got token');

        // 2. Try to download a specific file we can see in the Caspio Files view
        const testFile = '10646-Black-5-DT6107BlackFlatFront-337W.jpg'; // This is an actual file from the listing
        console.log('\nTesting with file:', testFile);

        // First get the file listing to find the ExternalKey
        console.log('\nGetting file listing...');
        const listResponse = await axios.get(
            `${process.env.API_BASE_URL}/files?folder=Artwork`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const files = listResponse.data?.Result?.Files || [];
        console.log('\nFiles in Artwork folder:', files.map(f => f.Name).join('\n'));

        const file = files.find(f => {
            // Try different variations of the filename
            const normalizedTestFile = testFile.toLowerCase().replace(/[-\s]/g, '');
            const normalizedFileName = f.Name.toLowerCase().replace(/[-\s]/g, '');
            return normalizedFileName === normalizedTestFile;
        });

        if (!file) {
            console.log('\nFile not found in listing');
            return;
        }

        console.log('\nFound file:', file);
        console.log('ExternalKey:', file.ExternalKey);
        console.log('ContentType:', file.ContentType);
        console.log('Size:', Math.round(file.Size / 1024), 'KB');

        // Try to download using ExternalKey
        console.log('\nAttempting download...');
        const fileResponse = await axios.get(
            `${process.env.API_BASE_URL}/files/${file.ExternalKey}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: '*/*'
                },
                responseType: 'arraybuffer'
            }
        );

        if (fileResponse.status === 200) {
            const saveDir = path.join(__dirname, 'test-images');
            const savePath = path.join(saveDir, file.Name);

            await fs.promises.mkdir(saveDir, { recursive: true });
            await fs.promises.writeFile(savePath, fileResponse.data);

            console.log('\n✓ File successfully downloaded and saved to:', savePath);
            console.log('File size:', Math.round(fileResponse.data.length / 1024), 'KB');
            
            const buffer = fileResponse.data;
            const fileSignature = buffer.slice(0, 4).toString('hex');
            console.log('File signature:', fileSignature);
        } else {
            console.log('Download failed with status:', fileResponse.status);
            console.log('Headers:', fileResponse.headers);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            try {
                const textData = Buffer.from(error.response.data).toString('utf8');
                console.error('Response data:', textData);
            } catch (e) {
                console.error('Raw response data:', error.response.data);
            }
        }
    }
}

console.log('Testing specific file download...');
testSpecificFile().catch(console.error);
