const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

// Test cases for artwork update functionality
const testCases = [
    {
        name: 'Update Status',
        id: '51266',  // Using an ID we saw in search results
        data: {
            Status: 'In Progress'
        },
        description: 'Should update artwork status'
    },
    {
        name: 'Update User Email',
        id: '51267',
        data: {
            User_Email: 'nika@nwcustomapparel.com'
        },
        description: 'Should update assigned user email'
    },
    {
        name: 'Update Multiple Fields',
        id: '51268',
        data: {
            Status: 'Awaiting Approval',
            User_Email: 'nika@nwcustomapparel.com',
            Due_Date: '2024-01-31'
        },
        description: 'Should update multiple fields at once'
    }
];

// Function to run a test case
async function runTest(testCase) {
    console.log('\n' + '='.repeat(80));
    console.log(`Test: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log('-'.repeat(80));

    try {
        // First get the current state
        const getUrl = `http://localhost:3001/api/artwork?idFrom=${testCase.id}&idTo=${testCase.id}`;
        console.log('Getting current state:', getUrl);
        const before = await axios.get(getUrl);
        console.log('\nBefore update:', {
            ID_Design: before.data.Result[0].ID_Design,
            Status: before.data.Result[0].Status,
            User_Email: before.data.Result[0].User_Email,
            Due_Date: before.data.Result[0].Due_Date
        });

        // Perform update
        const updateUrl = `http://localhost:3001/api/artwork/${testCase.id}`;
        console.log('\nUpdating:', updateUrl);
        console.log('Update data:', testCase.data);
        
        const response = await axios.put(updateUrl, testCase.data);
        console.log('\nUpdate response:', response.data);

        // Get updated state
        const after = await axios.get(getUrl);
        console.log('\nAfter update:', {
            ID_Design: after.data.Result[0].ID_Design,
            Status: after.data.Result[0].Status,
            User_Email: after.data.Result[0].User_Email,
            Due_Date: after.data.Result[0].Due_Date
        });

        console.log('\nTest passed ✓');
    } catch (error) {
        console.error('\nTest failed ✗');
        console.error('Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting artwork update tests...\n');
    
    for (const testCase of testCases) {
        await runTest(testCase);
    }
    
    console.log('\nAll tests completed.');
}

// Execute tests
runAllTests().catch(console.error);
