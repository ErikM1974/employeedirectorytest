# Employee Directory with Drag & Drop

A web-based employee directory application built with React and Node.js that integrates with Caspio's REST API. Features include drag-and-drop department management, employee image uploads, and real-time updates.

## Features

- **Drag & Drop Interface**: Easily move employees between departments using drag-and-drop functionality
- **Image Management**: Upload and update employee profile images with instant preview
- **Department Organization**: Visual department-based organization with color coding
- **Real-time Updates**: Immediate UI updates after any changes
- **Employee Management**: Add, edit, and delete employee records
- **Responsive Design**: Works seamlessly across different screen sizes

## System Requirements

### Development Environment
- Node.js 14.x or higher
- npm 6.x or higher
- Git 2.x or higher
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- 2GB RAM minimum
- 1GB free disk space

### Production Environment
- Node.js 14.x or higher
- 1GB RAM minimum
- 2GB free disk space
- HTTPS certificate for production deployment
- Environment variables configuration

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- iOS Safari 13+
- Chrome for Android 80+

### Network Requirements
- Stable internet connection
- Access to Caspio API endpoints
- Outbound HTTPS (port 443) access
- WebSocket support for development

## Troubleshooting Guide

### Common Issues and Solutions

#### Image Upload Issues
1. **Image Upload Fails**
   - Verify file size is under 5MB
   - Check supported formats (jpg, jpeg, png, gif)
   - Ensure "File" field name is correct
   - Clear browser cache and retry

2. **Image Not Displaying After Upload**
   - Refresh the page
   - Check browser console for errors
   - Verify image URL format
   - Clear browser cache

#### Authentication Issues
1. **Token Errors**
   - Check Caspio credentials in .env file
   - Verify token endpoint URL
   - Clear local storage and refresh
   - Check token expiration handling

2. **API Access Denied**
   - Verify API permissions in Caspio
   - Check if token is being sent correctly
   - Ensure correct API endpoint URLs

#### Development Setup Issues
1. **npm Install Fails**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and package-lock.json
   - Run `npm install` again
   - Check Node.js version compatibility

2. **Server Won't Start**
   - Check if ports 3000/3001 are available
   - Verify all environment variables are set
   - Check for syntax errors in recent changes
   - Review server logs for errors

#### Database Connection Issues
1. **Cannot Connect to Caspio**
   - Verify network connectivity
   - Check Caspio service status
   - Validate API credentials
   - Review CORS settings

2. **Data Not Updating**
   - Check API response status codes
   - Verify data format in requests
   - Review error handling implementation
   - Check browser console for errors

### Performance Issues
1. **Slow Loading Times**
   - Check network connection speed
   - Verify image sizes and formats
   - Review browser console for warnings
   - Check for unnecessary re-renders

2. **Drag and Drop Lag**
   - Reduce number of items per column
   - Check browser memory usage
   - Verify React component optimization
   - Review event handler implementations

### Quick Fixes
- Clear browser cache and reload
- Restart development servers
- Check console for error messages
- Verify environment variables
- Review recent code changes
- Check network connectivity
- Validate API endpoints

## Technical Details

### Frontend (React)
- React with hooks for state management
- react-beautiful-dnd for drag-and-drop functionality
- Axios for API communication
- Real-time image updates with cache busting
- Modal-based editing interface
- Optimistic UI updates for better user experience

### Backend (Node.js/Express)
- Express.js server with RESTful API
- Caspio REST API integration
- Multer for file upload handling
- Proper handling of multipart/form-data
- Automatic token management
- Error handling and validation

### Image Handling
- Support for various image formats
- Automatic image optimization
- Secure file upload handling
- Proper cleanup of temporary files
- Cache control for image updates

## Recent Updates

### Modern UI Overhaul
- Implemented intuitive two-step employee creation process
- Added step indicators with visual progress tracking
- Enhanced form fields with descriptive icons
- Improved input styling and visual hierarchy
- Added helpful placeholder text and tooltips
- Implemented consistent card-based layout design

### Image Upload Improvements
- Redesigned image upload interface with larger preview
- Added modern floating "+" button for file selection
- Implemented hidden file input with styled trigger
- Added toast notifications for upload success/failure
- Improved image preview with better error handling
- Added cache busting for immediate image updates

### Enhanced User Experience
- Added real-time feedback with toast notifications
- Improved button styling and hover effects
- Enhanced modal interactions and transitions
- Implemented responsive design for all screen sizes
- Added loading indicators for better feedback
- Improved error messaging with clear instructions

### Performance Optimizations
- Optimized image loading and caching
- Improved state management for smoother updates
- Enhanced drag-and-drop performance
- Reduced unnecessary re-renders
- Implemented efficient error handling

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd caspio-dragdrop-app
   npm install
   cd client
   npm install
   ```

3. Configure environment variables:
   - Create `.env` file in server directory
   - Add Caspio credentials and endpoints

4. Start the development servers:
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   npm start
   ```

## API Endpoints

- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `PUT /api/employees/:id/image` - Update employee image
- `GET /api/employees/:id/image` - Get employee image

## Error Handling

The application includes comprehensive error handling:
- API communication errors
- Image upload failures
- Invalid file types
- Network issues
- Token expiration
- Server errors

## Caspio API Integration

### Authentication Flow
```javascript
// 1. Get Bearer Token
POST ${process.env.TOKEN_ENDPOINT}
Headers:
  Content-Type: application/x-www-form-urlencoded
Auth:
  Username: ${process.env.CASPIO_CLIENT_ID}
  Password: ${process.env.CASPIO_CLIENT_SECRET}
Body:
  grant_type=client_credentials

Response:
{
  "access_token": "...",
  "expires_in": 3600
}
```

### Employee Records API

#### List All Employees
```javascript
GET ${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/records
Headers:
  Authorization: bearer {token}
  Accept: application/json

Response:
{
  "Result": [
    {
      "ID_Employee": number,
      "EmployeeName": string,
      "Department": string,
      "StartDate": string | null
    }
  ]
}
```

#### Create Employee
```javascript
POST ${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/records
Headers:
  Authorization: bearer {token}
  Content-Type: application/json
  Accept: application/json
Body:
{
  "EmployeeName": string,
  "Department": string,
  "StartDate": string | null  // ISO format: YYYY-MM-DD
}

Response:
{
  "Result": [{
    "ID_Employee": number,
    "EmployeeName": string,
    "Department": string,
    "StartDate": string | null
  }]
}
```

#### Update Employee
```javascript
PUT ${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/records
Headers:
  Authorization: bearer {token}
  Content-Type: application/json
  Accept: application/json
Query Parameters:
  q.where=ID_Employee={id}
Body:
{
  "EmployeeName"?: string,
  "Department"?: string,
  "StartDate"?: string | null
}

Response: Status 204 No Content
```

#### Delete Employee
```javascript
DELETE ${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/records
Headers:
  Authorization: bearer {token}
Query Parameters:
  q.where=ID_Employee={id}

Response: Status 204 No Content
```

### Image Management API

#### Upload Image
```javascript
PUT ${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/attachments/Image/{id}
Headers:
  Authorization: bearer {token}
  Content-Type: multipart/form-data
Body:
  Form Data:
    File: (binary)  // Field name must be exactly "File"

Response: Status 204 No Content
```

#### Get Image
```javascript
GET ${process.env.API_BASE_URL}/tables/${process.env.TABLE_NAME}/attachments/Image/{id}
Headers:
  Authorization: bearer {token}
  Accept: */*
Query Parameters:
  v={timestamp}  // Optional: For cache busting

Response:
  Content-Type: image/*
  Body: Binary image data
```

### Important Notes

1. **Token Management**
   - Tokens expire after 1 hour
   - Implement automatic token refresh
   - Handle 401 errors by refreshing token and retrying request

2. **Error Handling**
   - 400: Bad Request (invalid data format)
   - 401: Unauthorized (token expired/invalid)
   - 404: Resource Not Found
   - 409: Conflict (duplicate record)
   - 500: Server Error

3. **Image Upload Requirements**
   - Max file size: 5MB
   - Supported formats: jpg, jpeg, png, gif
   - Field name must be "File" (case-sensitive)
   - Content-Type must be multipart/form-data

4. **Query Parameters**
   - q.where: SQL-like where clause
   - q.select: Comma-separated field list
   - q.sort: Field name with optional ASC/DESC
   - q.limit: Maximum records (default 100)
   - q.offset: Records to skip for pagination

### Response Codes
- 200: Success with response body
- 204: Success without response body (common for image uploads)
- 400: Bad request
- 401: Unauthorized (invalid/expired token)
- 404: Resource not found
- 500: Server error

### Query Parameters
- `q.where`: SQL-like where clause for filtering records
- `q.select`: Comma-separated list of fields to return
- `q.sort`: Field name with optional ASC/DESC
- `q.limit`: Maximum number of records to return
- `q.offset`: Number of records to skip

## Development & Deployment Workflow

### Branch Strategy
We use a two-branch strategy for development and deployment:
- `develop`: For local development and testing
- `main`: For production deployment on Heroku

### Local Development (develop branch)
1. Initial Setup
   ```bash
   # Clone the repository
   git clone https://github.com/your-org/caspio-dragdrop-app.git
   cd caspio-dragdrop-app
   git checkout develop

   # Install dependencies
   cd server && npm install
   cd ../client && npm install
   ```

2. Environment Setup
   ```bash
   # In server directory
   # Create development environment file
   cp .env.example .env.development
   # Edit .env.development with your credentials
   ```

3. Start Development Servers
   ```bash
   # Terminal 1: Start backend (from server directory)
   npm run dev

   # Terminal 2: Start frontend (from client directory)
   npm start
   ```

### Production Deployment on Heroku

#### Initial Heroku Setup
1. Ensure you have the Heroku CLI installed and are logged in
2. The application is configured for Heroku deployment with:
   - Root `package.json` for build configuration
   - `Procfile` for process management
   - Proper environment variable setup

#### Deployment Steps
1. Prepare for Deployment
   ```bash
   # Merge develop into main
   git checkout main
   git merge develop
   ```

2. Deploy to Heroku
   ```bash
   # Push to Heroku
   git push heroku main
   ```

#### Heroku Configuration
The application is configured with the following environment variables on Heroku:
```bash
# Required Environment Variables
NODE_ENV=production
TOKEN_ENDPOINT=https://c3eku948.caspio.com/oauth/token
API_BASE_URL=https://c3eku948.caspio.com/rest/v2
TABLE_NAME=EmployeeDirectoryTest
CASPIO_CLIENT_ID=[your-client-id]
CASPIO_CLIENT_SECRET=[your-client-secret]
```

#### Heroku Build Process
1. The build process is automated through:
   - `heroku-postbuild` script in package.json
   - Automatic dependency installation
   - React app build process
   - Static file serving configuration

2. The application uses:
   - Heroku-24 stack
   - Node.js buildpack
   - Automatic SSL certificate management
   - Heroku's built-in logging system

#### Monitoring and Maintenance
1. View application logs:
   ```bash
   heroku logs --tail -a employee-directory-test
   ```

2. Check application status:
   ```bash
   heroku ps -a employee-directory-test
   ```

3. Update environment variables:
   ```bash
   heroku config:set VARIABLE_NAME=value -a employee-directory-test
   ```

#### Production URL
The application is accessible at:
https://employee-directory-test-3a10f71455d0.herokuapp.com/

### Environment Configuration
```bash
# Development (.env.development)
NODE_ENV=development
TOKEN_ENDPOINT=https://c3eku948.caspio.com/oauth/token
API_BASE_URL=https://c3eku948.caspio.com/rest/v2
TABLE_NAME=EmployeeDirectoryTest
PORT=3001

# Production (.env.production)
NODE_ENV=production
TOKEN_ENDPOINT=https://c3eku948.caspio.com/oauth/token
API_BASE_URL=https://c3eku948.caspio.com/rest/v2
TABLE_NAME=EmployeeDirectoryTest
```

### Development Workflow
1. Always work on develop branch
2. Test changes thoroughly locally
3. When ready for production:
   - Merge develop into main
   - Deploy to Heroku
   - Return to develop for further development

### Automatic Deployment Features
- Heroku postbuild script builds the React app
- Production server serves both API and static files
- Environment-specific configurations
- Automatic port configuration in production

### Project Structure
```
caspio-dragdrop-app/
├── client/                 # React frontend
│   ├── src/               # Source files
│   ├── public/            # Static files
│   ├── package.json       # Frontend dependencies
│   └── .env              # Frontend environment variables
├── server/                # Express backend
│   ├── src/              # Source files
│   ├── public/           # Built React app (production)
│   ├── package.json      # Backend dependencies
│   └── .env             # Backend environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Root package.json
└── Procfile            # Heroku deployment config
```

### Best Practices
1. Environment Management
   - Use separate .env files for development and production
   - Never commit sensitive credentials
   - Use environment variables for configuration

2. Version Control
   - Maintain development and production branches
   - Use feature branches for new development
   - Follow Git Flow branching model

3. Testing
   - Test all changes in development first
   - Use staging environment if available
   - Perform thorough testing before production deployment

4. Deployment
   - Automate build and deployment process
   - Use continuous integration when possible
   - Maintain deployment documentation

5. Monitoring
   - Set up logging in production
   - Monitor application performance
   - Track error rates and API usage

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
