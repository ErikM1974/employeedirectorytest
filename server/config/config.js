const development = {
  port: 3001,
  clientUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:3001',
  env: 'development'
};

const production = {
  port: process.env.PORT || 3000,
  clientUrl: process.env.CLIENT_URL || 'https://employee-directory-test-3a10f71455d0.herokuapp.com',
  apiUrl: process.env.API_URL || 'https://employee-directory-test-3a10f71455d0.herokuapp.com',
  env: 'production'
};

const config = process.env.NODE_ENV === 'production' ? production : development;

module.exports = config;
