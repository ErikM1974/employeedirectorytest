require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testSpecificDesign() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // 2. Get the specific design record
        const designId = 52040;
        console.log(`\nFetching design record ${designId}...`);
        
        const recordResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${designId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const record = recordResponse.data?.Result?.[0];
        if (!record) {
            console.log('Design record not found');
            return;
        }

        console.log('\nFound design record:', {
            ID_Design: record.ID_Design,
            Status: record.Status,
            CompanyName: record.CompanyName,
            Due_Date: record.Due_Date,
            File_Upload_One: record.File_Upload_One
        });

        // 3. Look for the file in the Files list
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
        console.log(`Found ${files.length} files total`);

        // The file we're looking for from the record
        const targetFile = 'IMG_6990.JPG';
        console.log('\nLooking for file:', targetFile);

        // Find the file
        const file = files.find(f => f.Name === targetFile);
        if (file) {
            console.log('\nFound file:', {
                name: file.Name,
                externalKey: file.ExternalKey,
                contentType: file.ContentType,
                size: Math.round(file.Size / 1024) + ' KB'
            });

            // Try to get the file content
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

            // Show possible CDN URL
            const cdnUrl = `https://cdn.caspio.com/A0E15000B/Artwork/${encodeURIComponent(file.Name)}`;
            console.log('\nPossible CDN URL:', cdnUrl);

        } else {
            console.log('\nFile not found in files list');
            console.log('Available files:', files.map(f => f.Name).join('\n'));
        }

    } catch (error) {
        console.error('\nError:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Testing specific design...');
testSpecificDesign().catch(console.error);
