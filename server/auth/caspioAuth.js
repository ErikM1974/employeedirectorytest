const axios = require('axios');

class TokenManager {
    constructor(tokenEndpoint, clientId, clientSecret) {
        this.tokenEndpoint = tokenEndpoint;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.cachedToken = null;
        this.tokenExpiry = null;
        // Add 5 minute buffer before expiry to ensure we refresh before token expires
        this.expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    }

    async getToken() {
        // Check if token exists and is not expired (with buffer time)
        if (this.isTokenValid()) {
            return this.cachedToken;
        }

        // Token doesn't exist or is expired, get a new one
        return this.refreshToken();
    }

    isTokenValid() {
        return (
            this.cachedToken &&
            this.tokenExpiry &&
            new Date().getTime() < this.tokenExpiry - this.expiryBuffer
        );
    }

    async refreshToken() {
        try {
            const response = await axios.post(
                this.tokenEndpoint,
                'grant_type=client_credentials',
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    auth: {
                        username: this.clientId,
                        password: this.clientSecret
                    }
                }
            );

            this.cachedToken = response.data.access_token;
            
            // Set token expiry (typically 1 hour from now, but can be configured)
            const expiresIn = response.data.expires_in || 3600; // Default to 1 hour if not provided
            this.tokenExpiry = new Date().getTime() + (expiresIn * 1000);

            return this.cachedToken;
        } catch (error) {
            console.error('Error refreshing token:', error.message);
            throw error;
        }
    }

    async createAuthenticatedRequest(config) {
        try {
            const token = await this.getToken();
            return {
                ...config,
                headers: {
                    ...config.headers,
                    'Authorization': `bearer ${token}`
                }
            };
        } catch (error) {
            console.error('Error creating authenticated request:', error.message);
            throw error;
        }
    }

    // Helper to handle 401 errors and token refresh
    async handleRequest(requestFn) {
        try {
            return await requestFn();
        } catch (error) {
            if (error.response?.status === 401) {
                // Force token refresh
                this.cachedToken = null;
                this.tokenExpiry = null;
                
                // Retry the request once with new token
                return await requestFn();
            }
            throw error;
        }
    }
}

// Create singleton instance
const tokenManager = new TokenManager(
    process.env.TOKEN_ENDPOINT,
    process.env.CASPIO_CLIENT_ID || '25bea36404d34215e23255861c370d0fc417444f0af8e8477c',
    process.env.CASPIO_CLIENT_SECRET || '5316be27cadd4b56a235a544c9018aa54feb64d90805430011'
);

module.exports = tokenManager;
