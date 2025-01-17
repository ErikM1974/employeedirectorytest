require('dotenv').config({ path: '.env.development' });
const axios = require('axios');

async function testArtworkDashboard() {
    try {
        console.log('\nTesting Artwork Dashboard API Endpoints...');

        // 1. Test /api/artwork/requests
        console.log('\n1. Testing GET /api/artwork/requests');
        const requestsResponse = await axios.get('http://localhost:3001/api/artwork/requests');
        console.log('Got artwork requests:', requestsResponse.data.length, 'items');
        
        // Show sample request
        if (requestsResponse.data.length > 0) {
            const sample = requestsResponse.data[0];
            console.log('\nSample request:', {
                ID_Design: sample.ID_Design,
                CompanyName: sample.CompanyName,
                Status: sample.Status,
                Files: {
                    File_Upload_One: sample.File_Upload_One,
                    File_Upload_Two: sample.File_Upload_Two,
                    File_Upload_Three: sample.File_Upload_Three,
                    File_Upload_Four: sample.File_Upload_Four
                }
            });

            // 2. Test status update
            console.log('\n2. Testing PUT /api/artwork/status/:id');
            const currentStatus = sample.Status || '';
            const newStatus = currentStatus === 'In Progress' ? 'Completed' : 'In Progress';
            
            console.log('Current status:', currentStatus);
            console.log('Setting new status:', newStatus);

            const updateResponse = await axios.put(
                `http://localhost:3001/api/artwork/status/${sample.ID_Design}`,
                { status: newStatus }
            );
            console.log('Update response:', updateResponse.data);

            // 3. Verify the update
            console.log('\n3. Verifying status update...');
            const verifyResponse = await axios.get('http://localhost:3001/api/artwork/requests');
            const updatedRecord = verifyResponse.data.find(r => r.ID_Design === sample.ID_Design);
            
            if (updatedRecord) {
                console.log('Updated record:', {
                    ID_Design: updatedRecord.ID_Design,
                    CompanyName: updatedRecord.CompanyName,
                    OldStatus: currentStatus,
                    NewStatus: updatedRecord.Status
                });

                if (updatedRecord.Status === newStatus) {
                    console.log('\nStatus update successful!');
                } else {
                    console.error('\nStatus update failed - new status does not match');
                }
            } else {
                console.error('\nCould not find record after update');
            }
        }

        console.log('\nAll tests completed!');

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Starting API tests...');
testArtworkDashboard().catch(console.error);
