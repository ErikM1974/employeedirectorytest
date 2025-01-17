// Caspio CDN configuration
const config = {
    // Your Caspio account's first 8 AppKey characters
    appKey: 'A0E15000B',

    // CDN domains for different regions
    cdnDomains: {
        northAmerica: 'cdn.caspio.com',
        europe: 'eucdn.caspio.com',
        australia: 'aucdn.caspio.com',
        canada: 'cacdn.caspio.com',
        southAmerica: 'sacdn.caspio.com'
    },

    // Default CDN domain (change this based on your region)
    defaultCdnDomain: 'cdn.caspio.com',

    // Folder where artwork files are stored
    artworkFolder: 'Artwork',

    // Helper function to construct CDN URL
    getCdnUrl: (filename, domain = null) => {
        const cdnDomain = domain || config.defaultCdnDomain;
        const encodedFilename = encodeURIComponent(filename);
        return `https://${cdnDomain}/${config.appKey}/${config.artworkFolder}/${encodedFilename}`;
    },

    // Helper function to get filename from path
    getFilenameFromPath: (path) => {
        if (!path) return null;
        return path.split('/').pop();
    }
};

export default config;
