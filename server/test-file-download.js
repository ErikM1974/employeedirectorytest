require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tokenManager = require('./auth/caspioAuth');

async function testFileDownload() {
  try {
    // 1) Get a valid token
    const token = await tokenManager.getToken();
    console.log('Successfully got token');

    // 2) Get the file listing from Artwork folder
    console.log('\nGetting file listing from Artwork folder...');
    const listResponse = await axios.get(
      `${process.env.API_BASE_URL}/files`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    if (!listResponse.data?.Result?.Files) {
      console.log('No files found in response');
      return;
    }

    // List all files to help debug
    console.log('\nFiles in Artwork folder:');
    listResponse.data.Result.Files.forEach(file => {
      console.log(`- ${file.Name} (${Math.round(file.Size / 1024)} KB)`);
      console.log(`  ExternalKey: ${file.ExternalKey}`);
      console.log(`  ContentType: ${file.ContentType}`);
      console.log('');
    });

    // Try to download a file we can see in the listing
    const testFile = listResponse.data.Result.Files[0]; // Try the first file
    if (!testFile) {
      console.log('No files available to test');
      return;
    }

    console.log('\nAttempting to download:', testFile.Name);
    const endpoint = `/files/${testFile.ExternalKey}`;
    const downloadUrl = `${process.env.API_BASE_URL}${endpoint}`;

    console.log('Using files endpoint:', endpoint);
    console.log('Full URL:', downloadUrl);

    const fileResponse = await axios.get(downloadUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: '*/*'
      },
      responseType: 'arraybuffer',
      validateStatus: null,
    });

    console.log('\nResponse details:');
    console.log('Status:', fileResponse.status);
    console.log('Headers:', fileResponse.headers);

    if (fileResponse.status === 200) {
      const saveDir = path.join(__dirname, 'test-images');
      const savePath = path.join(saveDir, testFile.Name);

      await fs.promises.mkdir(saveDir, { recursive: true });
      await fs.promises.writeFile(savePath, fileResponse.data);

      console.log('\n✓ File saved to:', savePath);

      const stats = await fs.promises.stat(savePath);
      console.log('File size:', Math.round(stats.size / 1024), 'KB');
      
      const buffer = fileResponse.data;
      const fileSignature = buffer.slice(0, 4).toString('hex');
      console.log('File signature:', fileSignature);
    } else {
      // Try to parse error response
      const textData = Buffer.from(fileResponse.data).toString('utf8');
      try {
        const jsonData = JSON.parse(textData);
        console.log('Error response JSON:', jsonData);
      } catch {
        console.log('Error response text:', textData);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      try {
        const errorText = Buffer.from(error.response.data).toString('utf8');
        console.log('Error response:', errorText);
      } catch (e) {
        console.log('Raw error data:', error.response.data);
      }
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

// Run the test
console.log('Testing file download...');
testFileDownload().catch(console.error);
