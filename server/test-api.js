const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env.development')
});

const API_URL = 'http://localhost:3001';

// Create a test image file
const createTestImage = () => {
  const testImagePath = path.join(__dirname, 'test-image.txt');
  fs.writeFileSync(testImagePath, 'Test image content');
  return testImagePath;
};

// Helper to log responses
const logResponse = (endpoint, response) => {
  console.log(`\n=== ${endpoint} ===`);
  console.log('Status:', response.status);
  if (response.data) {
    console.log('Data:', JSON.stringify(response.data, null, 2));
  }
};

// Helper to handle errors
const handleError = (error, operation) => {
  console.error(`\n${operation} failed:`, error.message);
  if (error.response) {
    console.error('Response status:', error.response.status);
    console.error('Response data:', error.response.data);
    if (error.response.headers) {
      console.error('Response headers:', error.response.headers);
    }
  }
  if (error.config) {
    console.error('Request URL:', error.config.url);
    console.error('Request method:', error.config.method);
    if (error.config.data) {
      console.error('Request data:', error.config.data);
    }
  }
  throw error;
};

const runTests = async () => {
  let testEmployeeId;

  try {
    // Check if server is running
    try {
      await axios.get(`${API_URL}/api/employees`);
    } catch (error) {
      console.error('\nServer not running or not accessible:', error.message);
      console.error('Make sure the server is running on port 3001');
      process.exit(1);
    }

    // 1. Test GET /api/employees
    console.log('\nTesting GET /api/employees');
    try {
      const getEmployeesResponse = await axios.get(`${API_URL}/api/employees`);
      logResponse('GET /api/employees', getEmployeesResponse);
    } catch (error) {
      handleError(error, 'GET /api/employees');
    }

    // 2. Test POST /api/employees
    console.log('\nTesting POST /api/employees');
    try {
      const createResponse = await axios.post(`${API_URL}/api/employees`, {
        EmployeeName: `Test Employee ${Date.now()}`,
        Department: 'Sales',
        StartDate: '2025-01-15'
      });
      logResponse('POST /api/employees', createResponse);
      
      // The response should contain the newly created employee
      if (!createResponse.data?.ID_Employee) {
        throw new Error('No employee ID returned from creation');
      }
      
      testEmployeeId = createResponse.data.ID_Employee;
      console.log('Created test employee with ID:', testEmployeeId);
    } catch (error) {
      handleError(error, 'POST /api/employees');
    }

    // 3. Test PUT /api/employees/:id/image
    if (testEmployeeId) {
      console.log('\nTesting PUT /api/employees/:id/image');
      try {
        const testImagePath = createTestImage();
        const formData = new FormData();
        formData.append('File', fs.createReadStream(testImagePath));

        const uploadResponse = await axios.put(
          `${API_URL}/api/employees/${testEmployeeId}/image`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Accept': 'application/json'
            }
          }
        );
        logResponse('PUT /api/employees/:id/image', uploadResponse);

        // Clean up test image
        fs.unlinkSync(testImagePath);
      } catch (error) {
        handleError(error, 'PUT /api/employees/:id/image');
      }
    }

    // 4. Test GET /api/employees/:id/image
    if (testEmployeeId) {
      console.log('\nTesting GET /api/employees/:id/image');
      try {
        const getImageResponse = await axios.get(
          `${API_URL}/api/employees/${testEmployeeId}/image`,
          { responseType: 'stream' }
        );
        console.log('Image response status:', getImageResponse.status);
        console.log('Image content type:', getImageResponse.headers['content-type']);
      } catch (error) {
        handleError(error, 'GET /api/employees/:id/image');
      }
    }

    // 5. Test PUT /api/employees/:id
    if (testEmployeeId) {
      console.log('\nTesting PUT /api/employees/:id');
      try {
        const updateResponse = await axios.put(
          `${API_URL}/api/employees/${testEmployeeId}`,
          {
            EmployeeName: 'Updated Test Employee',
            Department: 'Production'
          }
        );
        logResponse('PUT /api/employees/:id', updateResponse);
      } catch (error) {
        handleError(error, 'PUT /api/employees/:id');
      }
    }

    // 6. Test DELETE /api/employees/:id
    if (testEmployeeId) {
      console.log('\nTesting DELETE /api/employees/:id');
      try {
        const deleteResponse = await axios.delete(
          `${API_URL}/api/employees/${testEmployeeId}`
        );
        logResponse('DELETE /api/employees/:id', deleteResponse);
      } catch (error) {
        handleError(error, 'DELETE /api/employees/:id');
      }
    }

    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('\nTest suite failed:', error.message);
    process.exit(1);
  }
};

// Run the tests
console.log('Starting API tests...');
runTests();
