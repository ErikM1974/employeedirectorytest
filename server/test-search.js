const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

// Test cases for search functionality
const testCases = [
    {
        name: 'Search by company name',
        params: { company: 'Metal' }
    },
    {
        name: 'Search by status',
        params: { status: 'In Progress' }
    },
    {
        name: 'Search by rep',
        params: { rep: 'Nika Lao' }
    },
    {
        name: 'Search with date range',
        params: {
            dateFrom: '2024-01-01',
            dateTo: '2024-01-31'
        }
    },
    {
        name: 'Search with ID range',
        params: {
            idFrom: '52000',
            idTo: '53000'
        }
    },
    {
        name: 'Combined search with sorting',
        params: {
            company: 'Metal',
            status: 'In Progress',
            sortBy: 'CompanyName',
            sortDir: 'asc'
        }
    }
];

// Function to run a test case
async function runTest(testCase) {
    console.log(`\nRunning test: ${testCase.name}`);
    console.log('Parameters:', testCase.params);

    try {
        // Build query string
        const queryString = Object.entries(testCase.params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        const url = `http://localhost:3001/api/artwork?${queryString}`;
        console.log('Request URL:', url);

        const response = await axios.get(url);
        
        console.log('Response Status:', response.status);
        console.log('Records found:', response.data.Result?.length || 0);
        
        if (response.data.Result?.length > 0) {
            console.log('Sample record:', {
                ID_Design: response.data.Result[0].ID_Design,
                CompanyName: response.data.Result[0].CompanyName,
                Status: response.data.Result[0].Status,
                CustomerServiceRep: response.data.Result[0].CustomerServiceRep
            });
        }

        console.log('Test passed ✓');
    } catch (error) {
        console.error('Test failed ✗');
        console.error('Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

// Run all tests
async function runAllTests() {
    console.log('Starting search functionality tests...\n');
    
    for (const testCase of testCases) {
        await runTest(testCase);
    }
    
    console.log('\nAll tests completed.');
}

// Execute tests
runAllTests().catch(console.error);
