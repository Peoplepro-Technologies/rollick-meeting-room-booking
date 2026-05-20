# Meeting Room Booking Application - Installation and Management Guide

This document provides comprehensive instructions for installing, running, and managing the Meeting Room Booking application.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Process](#installation-process)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Running the Application](#running-the-application)
6. [Production Deployment](#production-deployment)
7. [Management and Maintenance](#management-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Backup and Recovery](#backup-and-recovery)

## System Requirements

### Minimum Requirements
- Node.js v16.0.0 or higher
- npm v8.0.0 or higher (or Yarn v1.22.0 or higher)
- 2GB RAM
- 1GB disk space

### Recommended Requirements
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher (or Yarn v1.22.0 or higher)
- 4GB RAM
- 2GB disk space

## Installation Process

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd meeting-room-booking
```

### Step 2: Install Dependencies
The application uses a monorepo structure with separate package.json files for client, server, and root.

Install all dependencies with:
```bash
npm run install:all
```

This command executes:
1. `npm install` (root dependencies)
2. `cd client && npm install` (frontend dependencies)
3. `cd ../server && npm install` (backend dependencies)

### Step 3: Environment Configuration
Copy the example environment file and configure it:
```bash
cp .env.example .env
```

Edit the `.env` file to set your configuration:
```
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here_change_in_production
```

### Step 4: Database Initialization
The application uses SQLite, which is file-based and requires no separate database server.

The database file (`database.sqlite`) should already exist in the root directory. If it doesn't exist or needs to be reset:
```bash
# Remove existing database (if any)
rm -f database.sqlite

# The database will be automatically initialized on first startup
```

## Environment Configuration

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production/test) | development | No |
| `PORT` | Backend server port | 5000 | No |
| `JWT_SECRET` | Secret key for JWT token signing | (required) | Yes |
| `FRONTEND_PORT` | Frontend development server port | 3000 | No |

### Configuration Files
Additional configuration can be found in:
- `config/auth.json` - Authentication settings
- `server/src/config/` - Server-specific configurations

## Database Setup

### SQLite Database
The application uses SQLite for simplicity. The database file is located at:
```
./database.sqlite
```

### Database Schema
On first startup, the application will automatically create the necessary tables:
- `users` - User accounts and authentication data
- `rooms` - Meeting room information
- `bookings` - Room booking records

### Database Migrations
If you need to modify the database schema in the future, migration scripts would be located in:
```
server/src/migrations/
```

Currently, the application uses automatic schema creation on startup.

## Running the Application

### Development Mode
To start both frontend and backend servers with hot reloading:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Backend Only
To start only the backend server:
```bash
npm run server:dev
```

### Frontend Only
To start only the frontend development server:
```bash
npm run client:dev
```

### Production Mode
To build the frontend for production:
```bash
npm run build
```

This creates an optimized production build in `client/dist/`.

To run the application in production:
```bash
npm start
```

This will serve the built frontend files through the Express server on the specified port.

## Production Deployment

### Preparing for Production
1. Set environment variables appropriately:
   ```bash
   NODE_ENV=production
   PORT=80  # or 443 if using SSL termination at reverse proxy
   JWT_SECRET=strong_random_string_here
   ```

2. Build the frontend:
   ```bash
   npm run build
   ```

3. Start the application:
   ```bash
   npm start
   ```

### Reverse Proxy Configuration (Recommended)
For production deployments, it's recommended to use a reverse proxy like Nginx:

#### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL/TLS Configuration (with Let's Encrypt)
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Management and Maintenance

### Checking Application Status
To check if the application is running:
```bash
# Check backend
curl -s http://localhost:5000/api/auth/me || echo "Backend not responding"

# Check frontend
curl -s http://localhost:3000 || echo "Frontend not responding"
```

### Viewing Logs
Development mode outputs logs directly to the console.

For production, consider implementing logging to files:
```bash
# Start with logging to file
npm start > application.log 2>&1 &
```

### Updating Dependencies
To update all dependencies:
```bash
npm run install:all
```

To check for outdated packages:
```bash
npm outdated
# In client directory
cd client && npm outdated
# In server directory
cd ../server && npm outdated
```

### Default Admin Account
The application comes with a default administrator account:
- Username: `admin`
- Password: `admin123`

**Important**: Change this password immediately after first login in production environments.

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
If you get an error like "Address already in use":
```bash
# Find what's using the port
lsof -i :5000   # or lsof -i :3000 for frontend

# Kill the process
kill -9 <PID>
```

#### 2. Database Connection Issues
If you encounter database errors:
```bash
# Check if database file exists and is readable
ls -la database.sqlite

# Check permissions
chmod 664 database.sqlite
chown $USER:$USER database.sqlite
```

#### 3. Frontend Not Connecting to Backend
Ensure the frontend is configured to connect to the correct backend URL:
Check `client/src/api/client.js` or similar API configuration files.

#### 4. Authentication Failures
If login fails:
1. Verify JWT secret is set correctly in `.env`
2. Check that the database has been initialized properly
3. Ensure bcryptjs is installed correctly (`npm install bcryptjs` in server directory)

### Diagnostic Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list

# Check if ports are in use
netstat -tulpn | grep LISTEN
```

## Backup and Recovery

### Database Backup
Since the database is a single SQLite file:
```bash
# Backup
cp database.sqlite database.sqlite.backup_$(date +%Y%m%d_%H%M%S)

# Restore
cp database.sqlite.backup_YYYYMMDD_HHMMSS database.sqlite
```

### Full Application Backup
```bash
# Create tarball of entire application
tar -czf meeting-room-booking-backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    --exclude=node_modules \
    --exclude=client/node_modules \
    --exclude=server/node_modules \
    .
```

### Restoration
```bash
tar -xzf meeting-room-booking-backup_YYYYMMDD_HHMMSS.tar.gz
npm install  # Reinstall dependencies
```

## Security Considerations

### Environment Variables
Never commit `.env` file to version control. The `.gitignore` file should already exclude it.

### JWT Secret
Generate a strong secret for production:
```bash
# Generate a random 32-byte hex string
openssl rand -hex 32
```

### CORS Configuration
Check `server/src/middleware/cors.js` or similar to ensure appropriate CORS settings for your environment.

### HTTPS
Always use HTTPS in production. Consider using Let's Encrypt for free SSL certificates.

## Directory Structure Overview
```
meeting-room-booking/
├── client/                 # React frontend
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── src/                # Source code
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Custom middleware
│   │   └── app.js          # Express app
│   ├── migrations/         # Database migrations
│   └── package.json
├── config/                 # Configuration files
├── database.sqlite         # SQLite database
├── .env.example            # Environment variables example
├── .gitignore              # Git ignore rules
├── package.json            # Root package.json
├── README.md               # Project overview
└── INSTALLATION_GUIDE.md   # This document
```

## Getting Help
If you encounter issues not covered in this guide:

1. Check the [README.md](./README.md) for basic information
2. Review the code comments throughout the application
3. Ensure all dependencies are properly installed
4. Verify environment variables are set correctly
5. Check console output for error messages

For contribution guidelines, please refer to [CONTRIBUTING.md] if it exists in the repository.

---
*Last updated: May 20, 2026*