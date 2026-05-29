# Local Development Setup

Complete guide for setting up the Meeting Room Booking System on your local machine.

## Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **Git**

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ROLLICK-MEETING-ROOM-BOOKING
```

### 2. Install All Dependencies

**Option A: Install everything at once**
```bash
npm run install:all
```
This installs root dependencies (concurrently) and all subdirectory dependencies.

**Option B: Install separately**
```bash
# Root dependencies (includes concurrently)
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
cd ..
```

### 3. Dependencies Overview

**Root:**
- `concurrently` - Run multiple npm scripts together

**Server:**
- `express` - Web framework
- `jsonwebtoken` - Authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables
- `sqlite3` - SQLite database

**Client:**
- `react` - UI framework
- `@mui/material` - Material-UI components
- `@fullcalendar/react` - Calendar component
- `axios` - HTTP client
- `react-router-dom` - Routing
- `date-fns` - Date utilities

## Environment Configuration

### Server Environment

Create `server/.env`:

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```bash
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
DATABASE_URL=./database.sqlite
FRONTEND_URL=http://localhost:3000
```

### Client Environment

Create `client/.env`:

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
```

## Database Setup (SQLite)

The application uses SQLite for persistent data storage.

### 1. Initialize Database

```bash
cd server
npm run db:init
```

This creates:
- SQLite database file at `server/database.sqlite`
- Database tables (users, rooms, bookings, themes)
- Sample data including:
  - Admin user: `admin@meetingroom.com` / `admin123`
  - 3 sample rooms
  - 1 sample booking
  - Default theme

### 2. Database Location

The database file is created at:
- **Default**: `server/database.sqlite`
- **Custom**: Set `DATABASE_URL` in `server/.env`

### 3. Database Features

- **Persistent**: Data survives server restarts
- **File-based**: Single file database
- **Auto-backup**: Easy to backup/restore by copying the database file
- **No additional services**: Runs embedded in the application

## Running the Application

### Option 1: Both Services Together

From the project root:

```bash
npm run dev
```

This runs both servers concurrently:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:3000`

### Option 2: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## Verify Installation

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/api/rooms
   ```
   Should return a JSON array of rooms.

2. **Frontend Access**
   - Open browser: `http://localhost:3000`
   - Login with: `admin@meetingroom.com` / `admin123`

## Common Issues & Solutions

### Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000
# Kill the process
kill -9 <PID>
```



### CORS Errors

**Error**: API calls blocked by CORS policy

**Solution**: Check `server/.env` has correct `FRONTEND_URL`

### Module Not Found

**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
cd <server-or-client>
npm install
```

## Development Workflow

### Making Changes

1. **Backend Changes**: Restart server automatically with `nodemon`
2. **Frontend Changes**: Vite hot-reloads automatically
3. **Database Schema Changes**: Modify the table structure in `server/src/lib/db.js` and reinitialize database

### Running Tests

```bash
# Backend tests (if configured)
cd server
npm test

# Frontend tests (if configured)
cd client
npm test
```

### Building for Production

```bash
# Build client
cd client
npm run build

# Output in client/dist/
```

## IDE Setup

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Prisma
- TypeScript
- GitLens

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "client/node_modules/typescript/lib"
}
```

## Database Management

### View All Data

You can view the data through the API endpoints or use any SQLite browser tool:

**Recommended Tools:**
- **DB Browser for SQLite** (https://sqlitebrowser.org/)
- **VS Code Extension**: SQLite Explorer
- **Command line**: `sqlite3 server/database.sqlite`

### Backup Database

```bash
# Copy the database file
cp server/database.sqlite backup-$(date +%Y%m%d).sqlite
```

### Reset Database

**Option 1: Delete and recreate**
```bash
rm server/database.sqlite
cd server
npm run db:init
```

**Option 2: Clear tables only** (preserves structure)
```bash
# This will delete all data but keep tables
sqlite3 server/database.sqlite "DELETE FROM users; DELETE FROM rooms; DELETE FROM bookings; DELETE FROM themes;"
```

⚠️ **Warning**: Both options will delete all your data!

### Modify Database Structure

1. **Update schema**: Edit `server/src/lib/db.js`
2. **Add migration logic**: Update the `initializeTables` method
3. **Reinitialize**: Delete the database file and run `npm run db:init`

### Database File Location

- **Default**: `server/database.sqlite`
- **Custom**: Set `DATABASE_URL` in `server/.env` (e.g., `/path/to/your/database.sqlite`)

## Next Steps

- Read [README.md](./README.md) for overview
- Explore the codebase in `server/src/` and `client/src/`
- Check [LOCAL_NETWORK_SETUP.md](./LOCAL_NETWORK_SETUP.md) for network deployment

## Getting Help

If you encounter issues:

1. Check terminal error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Try clearing node_modules and reinstalling:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
