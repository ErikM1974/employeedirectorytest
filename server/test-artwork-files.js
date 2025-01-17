require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testArtworkFiles() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // 2. Get artwork records to see file paths
        console.log('\nFetching artwork records...');
        const recordsResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const records = recordsResponse.data?.Result || [];
        console.log(`\nFound ${records.length} records`);

        // Get a sample record with a file
        const sampleRecord = records.find(r => r.File_Upload_One);
        if (!sampleRecord) {
            console.log('No records with files found');
            return;
        }

        console.log('\nSample record:', {
            ID_Design: sampleRecord.ID_Design,
            filePath: sampleRecord.File_Upload_One
        });

        // 3. Get files from the Artwork folder
        console.log('\nFetching files from Artwork folder...');
        const filesResponse = await axios.get(
            `${process.env.API_BASE_URL}/files?folder=Artwork`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const files = filesResponse.data?.Result?.Files || [];
        console.log(`Found ${files.length} files in Artwork folder`);

        // Get the filename from the path
        const filePath = sampleRecord.File_Upload_One;
        const fileName = filePath.split('/').pop();
        console.log('\nLooking for file:', fileName);

        // Find matching file
        const file = files.find(f => f.Name === fileName);
        if (file) {
            console.log('\nFound matching file:', {
                name: file.Name,
                externalKey: file.ExternalKey,
                contentType: file.ContentType,
                size: Math.round(file.Size / 1024) + ' KB'
            });

            // Test CDN URL
            const cdnUrl = `https://cdn.caspio.com/A0E15000B/Artwork/${encodeURIComponent(fileName)}`;
            console.log('\nCDN URL would be:', cdnUrl);

            // Try to get file content
            console.log('\nTrying to get file content...');
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

            console.log('Success! Got file content:', {
                contentType: fileResponse.headers['content-type'],
                size: Math.round(fileResponse.data.length / 1024) + ' KB'
            });

        } else {
            console.log('\nFile not found in Artwork folder');
            console.log('Available files:', files.map(f => f.Name));
        }

    } catch (error) {
        console.error('\nError:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Testing artwork files...');
testArtworkFiles().catch(console.error);
