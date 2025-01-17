require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function getTableStructure() {
    try {
        // Get a valid token
        const token = await tokenManager.getToken();
        console.log('Successfully got token');

        // Get table structure
        console.log('\nGetting ArtRequests table structure...');
        const response = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/definition`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );

        if (response.data && response.data.Result) {
            console.log('\nTable Structure:');
            response.data.Result.forEach(field => {
                console.log(`\nField: ${field.Name}`);
                console.log(`Type: ${field.Type}`);
                console.log(`Is Primary Key: ${field.IsPrimaryKey}`);
                console.log(`Is Auto Number: ${field.IsAutoNumber}`);
                console.log(`Is Required: ${field.IsRequired}`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

// Run the test
console.log('Getting table structure...');
getTableStructure().catch(console.error);
