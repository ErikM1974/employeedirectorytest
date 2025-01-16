const axios = require('axios');
require('dotenv').config({ path: '.env.development' });

// Test artwork API connections
async function testArtworkAPI() {
  try {
    // Get access token
    console.log('1. Getting access token...');
    const tokenResponse = await axios.post(process.env.TOKEN_ENDPOINT, 
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.CASPIO_CLIENT_ID,
        client_secret: process.env.CASPIO_CLIENT_SECRET
      }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const token = tokenResponse.data.access_token;
    console.log('✓ Access token received');

    // List available tables
    console.log('\n2. Getting list of tables...');
    const tablesResponse = await axios.get(
      `${process.env.API_BASE_URL}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    const tables = tablesResponse.data.Result;
    console.log('\nAvailable tables:');
    tables.forEach(tableName => {
      console.log(`- ${tableName}`);
    });

    // Verify ArtRequests table exists
    if (!tables.includes('ArtRequests')) {
      throw new Error('ArtRequests table not found in Caspio');
    }
    console.log('\n✓ Found ArtRequests table');

    // Test creating artwork record
    console.log('\n3. Testing artwork record creation...');
    const createResponse = await axios.post(
      `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
      {
        CompanyName: 'Test Company',
        Status: 'In Progress',
        Due_Date: new Date().toISOString().split('T')[0],
        CustomerServiceRep: 'Test User',
        Note_Mockup: 'Test artwork record'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Create Response:', JSON.stringify(createResponse.data, null, 2));
    console.log('✓ Record created successfully');

    // Get the latest record to find its ID
    console.log('\n4. Getting latest record...');
    const latestResponse = await axios.get(
      `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.sort=Date_Created DESC&q.limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    const newArtworkId = latestResponse.data?.Result?.[0]?.ID_Design;
    if (!newArtworkId) {
      throw new Error('Could not find newly created record');
    }
    console.log('✓ Found new record with ID:', newArtworkId);

    // Test getting all artwork records
    console.log('\n5. Testing artwork record retrieval...');
    const getResponse = await axios.get(
      `${process.env.API_BASE_URL}/tables/ArtRequests/records`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('✓ Retrieved artwork records:', getResponse.data.Result.length, 'records found');

    // Test updating artwork status
    console.log('\n6. Testing artwork status update...');
    await axios.put(
      `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${newArtworkId}`,
      {
        Status: 'Awaiting Approval'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✓ Updated artwork status');

    // Clean up test record
    console.log('\n7. Cleaning up test record...');
    await axios.delete(
      `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${newArtworkId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    console.log('✓ Deleted test record');

    console.log('\n✓ All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        url: error.response.config.url
      });
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error);
    }
  }
}

// Run tests
testArtworkAPI();
