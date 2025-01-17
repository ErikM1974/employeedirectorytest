require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testArtworkUrls() {
    try {
        // 1. Get token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // 2. Get artwork records to see what file paths we have
        console.log('\nFetching artwork records...');
        const artworkResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const records = artworkResponse.data?.Result || [];
        console.log(`\nFound ${records.length} artwork records`);

        // 3. Get list of files in Caspio
        console.log('\nFetching file list...');
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
        console.log(`Found ${files.length} files`);

        // 4. Check each record's file path
        console.log('\nAnalyzing file paths:');
        for (const record of records) {
            console.log(`\nRecord ID: ${record.ID_Design}`);
            
            if (record.File_Upload_One) {
                console.log('File path:', record.File_Upload_One);
                
                // Try to find matching file
                const fileName = record.File_Upload_One.split('/').pop();
                const file = files.find(f => f.Name === fileName);
                
                if (file) {
                    console.log('Found matching file:', {
                        name: file.Name,
                        externalKey: file.ExternalKey,
                        contentType: file.ContentType,
                        size: Math.round(file.Size / 1024) + ' KB'
                    });

                    // Test different CDN URLs
                    const cdnDomains = {
                        northAmerica: 'cdn.caspio.com',
                        europe: 'eucdn.caspio.com',
                        australia: 'aucdn.caspio.com',
                        canada: 'cacdn.caspio.com',
                        southAmerica: 'sacdn.caspio.com'
                    };

                    console.log('\nPossible CDN URLs:');
                    for (const [region, domain] of Object.entries(cdnDomains)) {
                        console.log(`\n${region}:`);
                        console.log(`https://${domain}/c3eku948/Artwork/${encodeURIComponent(fileName)}`);
                    }

                    // Test direct file access URL
                    console.log('\nDirect file access URL:');
                    console.log(`${process.env.API_BASE_URL}/files/${file.ExternalKey}`);
                } else {
                    console.log('WARNING: No matching file found in Caspio');
                }
            } else {
                console.log('No file path');
            }
        }

        // 5. List all available files
        console.log('\nAll available files:');
        files.forEach(file => {
            console.log('\nFile:', {
                name: file.Name,
                externalKey: file.ExternalKey,
                contentType: file.ContentType,
                size: Math.round(file.Size / 1024) + ' KB',
                dateCreated: file.DateCreated
            });
        });

    } catch (error) {
        console.error('\nError:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Testing artwork URLs...');
testArtworkUrls().catch(console.error);
