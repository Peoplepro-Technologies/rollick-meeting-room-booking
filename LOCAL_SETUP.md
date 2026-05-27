# Meeting Room Booking - Local Development Setup

## Overview
This application consists of two separate services:
- **Backend**: Node.js/Express server running on port 5000
- **Frontend**: React/Vite application running on port 3000

## Database
- **Development**: SQLite (file-based for local development)
- **Production**: PostgreSQL (managed on Railway)

## Prisma ORM
The application uses Prisma as the ORM with dual database support:
- Local development uses SQLite
- Production deployment on Railway uses PostgreSQL

## Prerequisites
- Node.js (v16 or higher)
- npm

## Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up Prisma and database:
```bash
# Navigate to server directory
cd server

# Generate Prisma client
npm run db:generate

# Create and run migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

## Running the Application

Start both servers simultaneously:
```bash
npm run dev
```

This will start:
- Backend server: http://localhost:5000
- Frontend application: http://localhost:3000

## Database Management
- **Prisma Studio**: `npm run db:studio` (web-based database GUI)
- **Database file**: `dev.db` (SQLite)
- **Environment variables**: Configure in `.env` file

## Default Admin Credentials
- Email: admin@meetingroom.com
- Password: admin123

## Development
- Backend automatically restarts on file changes (nodemon)
- Frontend supports hot module replacement (Vite HMR)

## API Endpoints
- Base URL: http://localhost:5000/api
- Authentication: `/auth/login`, `/auth/register`
- Rooms: `/rooms`
- Bookings: `/bookings`
- Users: `/users`

## Railway Deployment
The application is configured for Railway deployment:
- **Database**: Automatically provisioned PostgreSQL service
- **Environment Variables**: 
  - `DATABASE_PROVIDER=postgresql`
  - `DATABASE_URL` from Railway's PostgreSQL service
- **Build Command**: Automatically runs `npm run db:generate`

## Local Database Commands
```bash
# Generate Prisma client (after schema changes)
npm run db:generate

# Create new migration
npx prisma migrate dev --name migration-name

# Reset database (destructive)
npx prisma migrate reset

# Studio (database GUI)
npm run db:studio
```

## Notes
- SQLite database (`dev.db`) is automatically created on first run
- Frontend proxies API requests to backend via Vite proxy config