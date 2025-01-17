require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testFilesApi() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // 2. Get files list
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

        // 3. Log the full response structure
        console.log('\nFull Response Structure:');
        console.log(JSON.stringify(filesResponse.data, null, 2));

        // 4. Extract and show folders
        const folders = filesResponse.data?.Result?.Folders || [];
        console.log('\nFolders:', folders.map(folder => ({
            name: folder.Name,
            externalKey: folder.ExternalKey,
            contentType: folder.ContentType,
            dateCreated: folder.DateCreated
        })));

        // 5. Extract and show files
        const files = filesResponse.data?.Result?.Files || [];
        console.log('\nFiles:', files.map(file => ({
            name: file.Name,
            externalKey: file.ExternalKey,
            size: Math.round(file.Size / 1024) + ' KB',
            contentType: file.ContentType,
            dateCreated: file.DateCreated,
            lastModified: file.LastModified
        })));

        // 6. Test getting a specific file
        if (files.length > 0) {
            const testFile = files[0];
            console.log('\nTesting file download for:', testFile.Name);

            const fileResponse = await axios.get(
                `${process.env.API_BASE_URL}/files/${testFile.ExternalKey}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: '*/*'
                    },
                    responseType: 'arraybuffer'
                }
            );

            console.log('File download successful!');
            console.log('Content Type:', fileResponse.headers['content-type']);
            console.log('Content Length:', Math.round(fileResponse.data.length / 1024), 'KB');
        }

        // 7. Test folder contents
        if (folders.length > 0) {
            const testFolder = folders[0];
            console.log('\nTesting folder contents for:', testFolder.Name);

            const folderResponse = await axios.get(
                `${process.env.API_BASE_URL}/files?folder=${encodeURIComponent(testFolder.Name)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                }
            );

            console.log('Folder contents:', folderResponse.data?.Result?.Files?.map(file => file.Name));
        }

    } catch (error) {
        console.error('\nError:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Testing Files API...');
testFilesApi().catch(console.error);
