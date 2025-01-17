require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

const FILE_FIELDS = [
    'File_Upload_One',
    'File_Upload_Two',
    'File_Upload_Three',
    'File_Upload_Four'
];

async function testAttachmentType() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // 2. Get files list first
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
        const fileMap = new Map(files.map(f => [f.Name, f]));
        console.log('\nFound files in Caspio:', files.map(f => f.Name));

        // 3. Get a sample artwork record
        console.log('\nFetching artwork record...');
        const recordResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=52040`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const record = recordResponse.data?.Result?.[0];
        if (!record) {
            console.log('Record not found');
            return;
        }

        console.log('\nFound record:', {
            ID_Design: record.ID_Design,
            PK_ID: record.PK_ID,
            ...FILE_FIELDS.reduce((acc, field) => ({
                ...acc,
                [field]: record[field]
            }), {})
        });

        // Test each file field
        for (const field of FILE_FIELDS) {
            if (!record[field]) {
                console.log(`\nSkipping ${field} - no file uploaded`);
                continue;
            }

            console.log(`\nTesting ${field}:`, record[field]);

            // Get filename from path
            const fileName = record[field].replace(/^\//, '').replace(/^Artwork\//, '');
            console.log('Looking for file:', fileName);

            // Check if file exists in files list
            const fileInfo = fileMap.get(fileName);
            if (fileInfo) {
                console.log('Found file in Caspio files:', {
                    name: fileInfo.Name,
                    externalKey: fileInfo.ExternalKey,
                    contentType: fileInfo.ContentType,
                    size: Math.round(fileInfo.Size / 1024) + ' KB'
                });

                // Try to get the file content
                try {
                    const fileResponse = await axios.get(
                        `${process.env.API_BASE_URL}/files/${fileInfo.ExternalKey}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                Accept: '*/*'
                            },
                            responseType: 'arraybuffer'
                        }
                    );
                    console.log('Successfully retrieved file content!');
                    console.log('Content Type:', fileResponse.headers['content-type']);
                    console.log('Size:', Math.round(fileResponse.data.length / 1024), 'KB');
                } catch (err) {
                    console.log('Error getting file content:', err.message);
                }
            } else {
                console.log('File not found in Caspio files list');
            }

            // Try table attachment as fallback
            console.log('\nTrying table attachment endpoint...');
            try {
                const attachmentResponse = await axios.get(
                    `${process.env.API_BASE_URL}/tables/ArtRequests/attachments/${field}/${record.PK_ID}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: '*/*'
                        },
                        responseType: 'arraybuffer'
                    }
                );
                console.log('Success! File is also a table attachment');
                console.log('Content Type:', attachmentResponse.headers['content-type']);
                console.log('Size:', Math.round(attachmentResponse.data.length / 1024), 'KB');
            } catch (err) {
                console.log('Not a table attachment:', err.message);
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

console.log('Testing attachment types for all file fields...');
testAttachmentType().catch(console.error);
