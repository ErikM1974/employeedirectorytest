# Employee Directory with Drag & Drop

[Previous content up to Project Structure section remains exactly the same]

### Project Structure
```
caspio-dragdrop-app/
├── client/                 # React frontend
│   ├── src/               # Source files
│   │   └── components/    # React components
│   │       ├── artwork/   # Artwork dashboard components
│   │       │   ├── ArtworkDashboard.js  # Main artwork component
│   │       │   └── ImageViewer.js       # File preview component
│   │       └── employee/  # Employee directory components
│   ├── public/            # Static files
│   ├── package.json       # Frontend dependencies
│   └── .env              # Frontend environment variables
├── server/                # Express backend
│   ├── routes/           # API routes
│   │   ├── artwork.js    # Artwork request endpoints
│   │   └── employees.js  # Employee endpoints
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

## Artwork Dashboard Integration

### Features
- View and manage artwork requests
- Multiple file upload support (up to 4 files per request)
- Status management workflow
- File preview and download
- Search and filtering capabilities

### Artwork API Endpoints

#### Get All Artwork Requests
```javascript
GET /api/artwork/requests
Response:
{
  "Result": [
    {
      "ID_Design": number,
      "CompanyName": string,
      "Status": string,
      "File_Upload_One": {
        "path": string,
        "exists": boolean,
        "metadata": {
          "externalKey": string,
          "contentType": string,
          "size": number,
          "dateCreated": string
        }
      },
      "File_Upload_Two": object | null,
      "File_Upload_Three": object | null,
      "File_Upload_Four": object | null
    }
  ]
}
```

#### Update Artwork Status
```javascript
PUT /api/artwork/status/:id
Parameters:
  id: ID_Design value

Request Body:
{
  "status": string  // e.g., "In Progress", "Completed"
}

Response:
{
  "success": true
}
```

#### Get File Content
```javascript
GET /api/artwork/file/:externalKey
Parameters:
  externalKey: Caspio file external key

Response:
  - File content with appropriate Content-Type
  - Cache headers for optimization
```

### Caspio Integration for Artwork

#### List Records
```javascript
GET ${API_BASE_URL}/tables/ArtRequests/records
Headers:
  Authorization: bearer {token}
  Accept: application/json
```

#### Update Record Status
```javascript
PUT ${API_BASE_URL}/tables/ArtRequests/records?q.where=ID_Design={id}
Headers:
  Authorization: bearer {token}
  Content-Type: application/json
Body:
{
  "Status": string
}
```

#### Get Files List
```javascript
GET ${API_BASE_URL}/files
Headers:
  Authorization: bearer {token}
  Accept: application/json
```

#### Get File Content
```javascript
GET ${API_BASE_URL}/files/{externalKey}
Headers:
  Authorization: bearer {token}
  Accept: */*
```

### File Handling Notes
1. Files are stored in Caspio's file system
2. File paths in ArtRequests table reference Caspio files
3. File metadata is retrieved from Caspio files list
4. Files are served with proper caching and content headers
5. Multiple file fields supported (One through Four)

### Status Workflow
- Pending (empty status)
- In Progress
- Completed
- Rejected

### Components
- ArtworkDashboard: Main dashboard component
  - Displays artwork requests in a table
  - Handles status updates
  - Manages file downloads
- ImageViewer: File preview and download component
  - Renders file previews
  - Provides download functionality
  - Handles multiple file types

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
