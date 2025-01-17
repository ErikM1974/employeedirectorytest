require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function listAllFiles() {
    try {
        // Get token
        const token = await tokenManager.getToken();
        console.log('Successfully got token');

        // List files
        console.log('\nListing all files...');
        const response = await axios.get(
            `${process.env.API_BASE_URL}/files`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        if (response.data?.Result?.Files) {
            console.log('\nFiles found:');
            response.data.Result.Files.forEach(file => {
                console.log('\nFile Details:');
                console.log('Name:', file.Name);
                console.log('ExternalKey:', file.ExternalKey);
                console.log('ContentType:', file.ContentType);
                console.log('Size:', Math.round(file.Size / 1024), 'KB');
                console.log('DateCreated:', file.DateCreated);
            });
        } else {
            console.log('No files found in root');
        }

        // List folders
        if (response.data?.Result?.Folders) {
            console.log('\nFolders found:');
            response.data.Result.Folders.forEach(folder => {
                console.log('\nFolder Details:');
                console.log('Name:', folder.Name);
                console.log('ExternalKey:', folder.ExternalKey);
                console.log('DateCreated:', folder.DateCreated);
            });
        } else {
            console.log('No folders found');
        }

        // Try listing Artwork folder specifically
        console.log('\nChecking Artwork folder...');
        const artworkResponse = await axios.get(
            `${process.env.API_BASE_URL}/files?folder=Artwork`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        if (artworkResponse.data?.Result?.Files) {
            console.log('\nFiles in Artwork folder:');
            artworkResponse.data.Result.Files.forEach(file => {
                console.log('\nFile Details:');
                console.log('Name:', file.Name);
                console.log('ExternalKey:', file.ExternalKey);
                console.log('ContentType:', file.ContentType);
                console.log('Size:', Math.round(file.Size / 1024), 'KB');
                console.log('DateCreated:', file.DateCreated);
            });
        } else {
            console.log('No files found in Artwork folder');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Listing all files in Caspio...');
listAllFiles().catch(console.error);
