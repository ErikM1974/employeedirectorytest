const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

// Test cases for artwork image functionality
const testCases = [
    {
        name: 'Get existing image',
        id: '51266',  // Using an ID we know exists
        description: 'Should retrieve image for existing artwork'
    },
    {
        name: 'Get non-existent image',
        id: '99999',  // Using an ID that shouldn't exist
        description: 'Should handle non-existent image gracefully'
    }
];

// Function to run a test case
async function runTest(testCase) {
    console.log('\n' + '='.repeat(80));
    console.log(`Test: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log('-'.repeat(80));

    try {
        // First verify the artwork record exists
        const getUrl = `http://localhost:3001/api/artwork?idFrom=${testCase.id}&idTo=${testCase.id}`;
        console.log('Checking artwork record:', getUrl);
        const artwork = await axios.get(getUrl);
        
        if (artwork.data.Result && artwork.data.Result.length > 0) {
            console.log('\nArtwork record found:', {
                ID_Design: artwork.data.Result[0].ID_Design,
                File_Upload_One: artwork.data.Result[0].File_Upload_One
            });
        } else {
            console.log('\nNo artwork record found');
        }

        // Try to get the image
        const imageUrl = `http://localhost:3001/api/artwork/${testCase.id}/image`;
        console.log('\nFetching image:', imageUrl);
        
        const response = await axios.get(imageUrl, {
            responseType: 'stream'
        });

        console.log('\nImage response headers:', {
            contentType: response.headers['content-type'],
            contentLength: response.headers['content-length']
        });

        console.log('\nTest passed ✓');
    } catch (error) {
        if (error.response?.status === 404) {
            console.log('\nExpected 404 for non-existent image');
            console.log('Test passed ✓');
        } else {
            console.error('\nTest failed ✗');
            console.error('Error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        }
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting artwork image tests...\n');
    
    for (const testCase of testCases) {
        await runTest(testCase);
    }
    
    console.log('\nAll tests completed.');
}

// Execute tests
runAllTests().catch(console.error);
