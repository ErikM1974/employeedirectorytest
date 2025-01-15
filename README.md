# Employee Directory with Drag & Drop

A web-based employee directory application built with React and Node.js that integrates with Caspio's REST API. Features include drag-and-drop department management, employee image uploads, and real-time updates.

## Features

- **Drag & Drop Interface**: Easily move employees between departments using drag-and-drop functionality
- **Image Management**: Upload and update employee profile images with instant preview
- **Department Organization**: Visual department-based organization with color coding
- **Real-time Updates**: Immediate UI updates after any changes
- **Employee Management**: Add, edit, and delete employee records
- **Responsive Design**: Works seamlessly across different screen sizes

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

### Image Upload Improvements
- Fixed image upload functionality for instant updates
- Added proper handling of Caspio's 204 responses
- Implemented cache busting for immediate image refresh
- Added better error handling and user feedback
- Optimized image upload process

### API Integration
- Improved token management
- Better error handling for API responses
- Proper handling of multipart/form-data
- Optimized API request flow

### UI Enhancements
- Immediate visual feedback for all actions
- Improved modal interactions
- Better loading states
- Enhanced error messaging

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

### Authentication
```
POST https://c3eku948.caspio.com/oauth/token
```
- Requires client credentials (ID & Secret)
- Returns bearer token for subsequent requests
- Token must be refreshed periodically

### Employee Records

#### List All Employees
```
GET https://c3eku948.caspio.com/rest/v2/tables/EmployeeDirectoryTest/records
Headers:
  Authorization: bearer {token}
  Content-Type: application/json
```

#### Create Employee
```
POST https://c3eku948.caspio.com/rest/v2/tables/EmployeeDirectoryTest/records
Headers:
  Authorization: bearer {token}
  Content-Type: application/json
Body:
{
  "EmployeeName": string,
  "Department": string,
  "StartDate": string (optional, ISO format)
}
```

#### Update Employee
```
PUT https://c3eku948.caspio.com/rest/v2/tables/EmployeeDirectoryTest/records?q.where=ID_Employee={id}
Headers:
  Authorization: bearer {token}
  Content-Type: application/json
Body:
{
  "EmployeeName": string (optional),
  "Department": string (optional),
  "StartDate": string (optional, ISO format)
}
```

#### Delete Employee
```
DELETE https://c3eku948.caspio.com/rest/v2/tables/EmployeeDirectoryTest/records?q.where=ID_Employee={id}
Headers:
  Authorization: bearer {token}
```

### Employee Images

#### Upload Image
```
PUT https://c3eku948.caspio.com/rest/v2/tables/EmployeeDirectoryTest/attachments/Image/{id}
Headers:
  Authorization: bearer {token}
  Content-Type: multipart/form-data
Body:
  Form data with 'File' field containing image
```

#### Get Image
```
GET https://c3eku948.caspio.com/rest/v2/tables/EmployeeDirectoryTest/attachments/Image/{id}
Headers:
  Authorization: bearer {token}
```

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

### Production Deployment (main branch)
1. Prepare for Deployment
   ```bash
   # Merge develop into main
   git checkout main
   git merge develop
   ```

2. Deploy to Heroku
   ```bash
   # Deploy using our deploy script
   npm run deploy
   ```

3. Heroku Environment Setup (First Time)
   ```bash
   # Initialize Heroku
   heroku create your-app-name

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set TOKEN_ENDPOINT=your_token_endpoint
   heroku config:set API_BASE_URL=your_api_url
   heroku config:set TABLE_NAME=your_table_name
   ```

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
