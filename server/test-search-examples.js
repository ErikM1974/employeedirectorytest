const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

// Test cases showing example searches
const testCases = [
    {
        name: 'List all records (default)',
        params: {},
        description: 'Should show all records, sorted by ID_Design desc'
    },
    {
        name: 'Search by company name (partial match)',
        params: { company: 'Metal' },
        description: 'Should find companies with "Metal" in their name'
    },
    {
        name: 'Search by status',
        params: { 
            status: 'In Progress',
            sortBy: 'CompanyName',
            sortDir: 'asc'
        },
        description: 'Should find In Progress items, sorted by company name'
    },
    {
        name: 'Search by user email',
        params: {
            rep: 'nika@nwcustomapparel.com'
        },
        description: 'Should find items assigned to nika@nwcustomapparel.com'
    },
    {
        name: 'Search by ID range',
        params: {
            idFrom: '51000',
            idTo: '52000'
        },
        description: 'Should find items with ID_Design between 51000 and 52000'
    },
    {
        name: 'Combined search',
        params: {
            company: 'Metal',
            status: 'In Progress',
            sortBy: 'ID_Design',
            sortDir: 'desc'
        },
        description: 'Should find Metal companies with In Progress status, newest first'
    }
];

// Function to run a test case
async function runTest(testCase) {
    console.log('\n' + '='.repeat(80));
    console.log(`Test: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log('-'.repeat(80));

    try {
        // Build query string
        const queryString = Object.entries(testCase.params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        const url = `http://localhost:3001/api/artwork${queryString ? '?' + queryString : ''}`;
        console.log('Request URL:', url);

        const response = await axios.get(url);
        
        console.log('\nResults:');
        console.log(`Total records found: ${response.data.Result?.length || 0}`);
        
        if (response.data.Result?.length > 0) {
            console.log('\nSample records:');
            response.data.Result.slice(0, 3).forEach((record, index) => {
                console.log(`\n${index + 1}. ${record.CompanyName}`);
                console.log(`   ID_Design: ${record.ID_Design}`);
                console.log(`   Status: ${record.Status}`);
                console.log(`   User Email: ${record.User_Email}`);
                console.log(`   Date_Created: ${record.Date_Created}`);
            });
        }

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
    console.log('Starting search functionality examples...\n');
    
    for (const testCase of testCases) {
        await runTest(testCase);
    }
    
    console.log('\nAll examples completed.');
}

// Execute tests
runAllTests().catch(console.error);
