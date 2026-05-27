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
- `@prisma/client` - Database ORM
- `jsonwebtoken` - Authentication
- `bcryptjs` - Password hashing
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

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
DATABASE_URL="file:./dev.db"
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

## Database Setup (Local SQLite)

### 1. Generate Prisma Client

```bash
cd server
npx prisma generate
```

### 2. Create Initial Migration

```bash
npx prisma migrate dev --name init
```

This creates:
- SQLite database at `server/prisma/dev.db`
- Migration files in `server/prisma/migrations/`

### 3. Seed the Database

```bash
npx prisma db seed
```

This creates:
- Admin user: `admin@meetingroom.com` / `admin123`
- 3 sample rooms
- 1 sample booking

### 4. (Optional) Open Prisma Studio

```bash
npx prisma studio
```

Opens a GUI to view/edit your database at `http://localhost:5555`

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

### Prisma Client Not Generated

**Error**: `Error: @prisma/client did not initialize yet`

**Solution**:
```bash
cd server
npx prisma generate
```

### Database Locked

**Error**: `Database is locked`

**Solution**:
```bash
# Delete journal file
cd server/prisma
rm dev.db-journal
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
3. **Database Schema Changes**:
   ```bash
   cd server
   npx prisma migrate dev --name your_change
   ```

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

```bash
npx prisma studio
```

### Reset Database

```bash
npx prisma migrate reset
```

⚠️ **Warning**: This deletes all data!

### Create New Migration

```bash
npx prisma migrate dev --name describe_your_change
```

## Next Steps

- Read [README.md](./README.md) for overview
- Read [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for production deployment
- Explore the codebase in `server/src/` and `client/src/`

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
