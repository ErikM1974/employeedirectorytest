require('dotenv').config({ path: '.env.development' });
const axios = require('axios');
const tokenManager = require('./auth/caspioAuth');

async function testStatusUpdate() {
    try {
        // 1. Get a valid token
        const token = await tokenManager.getToken();
        console.log('\nGot Caspio token successfully');

        // 2. Get a sample record
        const id = 51266; // From previous test
        console.log('\nFetching record:', id);
        
        const getResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        if (!getResponse.data?.Result?.[0]) {
            console.error('Record not found');
            return;
        }

        const record = getResponse.data.Result[0];
        console.log('\nFound record:', {
            ID_Design: record.ID_Design,
            CompanyName: record.CompanyName,
            Status: record.Status
        });

        // 3. Try direct Caspio update
        console.log('\nTrying direct Caspio update...');
        const newStatus = record.Status === 'In Progress' ? '' : 'In Progress';
        
        try {
            const updateResponse = await axios.put(
                `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${id}`,
                { ...record, Status: newStatus },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Direct update response:', updateResponse.data);
        } catch (err) {
            console.error('Direct update failed:', err.message);
            if (err.response) {
                console.error('Response status:', err.response.status);
                console.error('Response data:', err.response.data);
            }
        }

        // 4. Verify the update
        console.log('\nVerifying update...');
        const verifyResponse = await axios.get(
            `${process.env.API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design=${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json'
                }
            }
        );

        const updatedRecord = verifyResponse.data?.Result?.[0];
        if (updatedRecord) {
            console.log('Updated record:', {
                ID_Design: updatedRecord.ID_Design,
                CompanyName: updatedRecord.CompanyName,
                Status: updatedRecord.Status
            });
        } else {
            console.log('Could not verify update');
        }

    } catch (error) {
        console.error('\nError:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

console.log('Testing status update...');
testStatusUpdate().catch(console.error);
