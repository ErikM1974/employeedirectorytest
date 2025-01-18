require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const tokenManager = require('./auth/caspioAuth');

async function uploadFile() {
    try {
        console.log('Getting token...');
        const token = await tokenManager.getToken();
        console.log('Token received:', token ? 'Yes' : 'No');

        // Create form data
        const form = new FormData();
        
        // First, let's check if we have the file locally
        const testFiles = [
            '10646-Black-5-DT6107BlackFlatFront-337W.jpg',
            '9757-BlackTriadSo-1-LST299BlackTriadSoModelFront-337W.jpg'
        ];

        // Check test-images directory
        console.log('\nChecking for artwork files in test-images directory...');
        const testImagesDir = './test-images';
        if (fs.existsSync(testImagesDir)) {
            const files = fs.readdirSync(testImagesDir);
            console.log('Files in test-images:', files);
        } else {
            console.log('test-images directory not found');
        }

        // Check uploads directory
        console.log('\nChecking for artwork files in uploads directory...');
        const uploadsDir = './uploads';
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log('Files in uploads:', files);
        } else {
            console.log('uploads directory not found');
        }

        // Check current directory
        console.log('\nChecking for artwork files in current directory...');
        const currentDirFiles = fs.readdirSync('.');
        console.log('Files in current directory:', currentDirFiles);

        // Get files list from Caspio
        console.log('\nFetching current files from Caspio...');
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

        // Try to find one of our test files
        const fileToUpload = testFiles.find(file => {
            // Check in test-images
            if (fs.existsSync(`${testImagesDir}/${file}`)) {
                return `${testImagesDir}/${file}`;
            }
            // Check in uploads
            if (fs.existsSync(`${uploadsDir}/${file}`)) {
                return `${uploadsDir}/${file}`;
            }
            // Check in current directory
            if (fs.existsSync(file)) {
                return file;
            }
            return false;
        });

        if (!fileToUpload) {
            console.log('\nNo artwork files found locally. Please provide the files to upload.');
            return;
        }

        console.log('\nUploading file:', fileToUpload);
        const fileStream = fs.createReadStream(fileToUpload);
        form.append('File', fileStream);

        console.log('\nSending to Caspio...');
        const uploadResponse = await axios.post(
            `${process.env.API_BASE_URL}/files`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        console.log('\nUpload response:', uploadResponse.data);

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Starting file upload test...\n');
uploadFile().catch(console.error);
