const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

// Test cases for artwork status updates
const testCases = [
    {
        name: 'Update to In Progress',
        id: '51266',
        newStatus: 'In Progress',
        description: 'Should update artwork status to In Progress'
    },
    {
        name: 'Update to Awaiting Approval',
        id: '51267',
        newStatus: 'Awaiting Approval',
        description: 'Should update artwork status to Awaiting Approval'
    },
    {
        name: 'Update to Completed',
        id: '51268',
        newStatus: 'Completed',
        description: 'Should update artwork status to Completed'
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
        
        if (before.data.Result && before.data.Result.length > 0) {
            console.log('\nBefore update:', {
                ID_Design: before.data.Result[0].ID_Design,
                Status: before.data.Result[0].Status || 'Not set',
                CompanyName: before.data.Result[0].CompanyName
            });
        } else {
            console.log('\nNo artwork found with ID:', testCase.id);
            return;
        }

        // Perform update
        const updateUrl = `http://localhost:3001/api/artwork/${testCase.id}`;
        console.log('\nUpdating status:', updateUrl);
        console.log('New status:', testCase.newStatus);
        
        const response = await axios.put(updateUrl, {
            Status: testCase.newStatus
        });
        console.log('\nUpdate response:', response.data);

        // Get updated state
        const after = await axios.get(getUrl);
        console.log('\nAfter update:', {
            ID_Design: after.data.Result[0].ID_Design,
            Status: after.data.Result[0].Status || 'Not set',
            CompanyName: after.data.Result[0].CompanyName
        });

        // Verify the update
        const success = after.data.Result[0].Status === testCase.newStatus;
        if (success) {
            console.log('\nTest passed ✓');
        } else {
            console.log('\nTest failed ✗ - Status not updated correctly');
        }
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
    console.log('Starting artwork status update tests...\n');
    
    for (const testCase of testCases) {
        await runTest(testCase);
    }
    
    console.log('\nAll tests completed.');
}

// Execute tests
runAllTests().catch(console.error);
