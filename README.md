# Meeting Room Booking System - Simplified Version

A simplified meeting room booking application with calendar interface, now using in-memory database instead of Prisma.

## Features

- **Room Management**: Create, view, update, and delete meeting rooms
- **Booking System**: Book rooms with time slots and calendar view
- **User Authentication**: Admin and user roles with JWT authentication
- **Responsive UI**: Material-UI based interface with full calendar integration
- **Local Network Access**: Can be accessed from other PCs on the same network

## Changes Made

This version has been simplified to remove external dependencies:

- ❌ **Removed**: Prisma ORM and database migrations
- ❌ **Removed**: Railway deployment configuration
- ✅ **Added**: SQLite database for persistent storage
- ✅ **Added**: Local network setup guide

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm run install:all
   ```

2. **Configure environment**:
   ```bash
   # Server environment
   cd server
   cp .env.example .env
   
   # Client environment  
   cd ../client
   cp .env.example .env
   ```

3. **Initialize database**:
   ```bash
   cd server
   npm run db:init
   ```

4. **Start the application**:
   ```bash
   # From project root
   npm run dev
   ```

4. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api`

### Default Login

- **Email**: `admin@meetingroom.com`
- **Password**: `admin123`

## Database

This version uses **SQLite** for persistent storage that:

- Automatically initializes with sample data
- Includes admin user, sample rooms, and bookings
- Persists data between server restarts
- Stores data in a single file (`server/database.sqlite`)
- Is suitable for development and small-scale production

### Database Features

- **File-based**: Single database file
- **Persistent**: Data survives server restarts
- **Easy backup**: Just copy the database file
- **No external services**: Embedded database

## Local Network Setup

To run the application on your local network so other PCs can access it:

1. **Find your PC's IP address**
2. **Update environment variables** to use your IP instead of localhost
3. **Start the application** with `npm run dev`
4. **Access from other PCs** using `http://YOUR_IP:3000`

See [LOCAL_NETWORK_SETUP.md](./LOCAL_NETWORK_SETUP.md) for detailed instructions.

## Project Structure

```
ROLLICK-MEETING-ROOM-BOOKING/
├── server/
│   ├── src/
│   │   ├── lib/
│   │   │   └── db.js          # In-memory database
│   │   ├── routes/            # API routes
│   │   └── app.js             # Main server file
│   └── package.json
├── client/
│   ├── src/                   # React components
│   └── vite.config.ts
└── package.json
```

## Development

### Backend Development

```bash
cd server
npm run dev
```

### Frontend Development

```bash
cd client
npm run dev
```

### Both Services

```bash
npm run dev
```

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create room (admin)
- `PUT /api/rooms/:id` - Update room (admin)
- `DELETE /api/rooms/:id` - Delete room (admin)
- `GET /api/bookings` - Get bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/theme` - Get theme settings

## Security Notes

- This version uses in-memory storage and is NOT suitable for production
- Change the default JWT secret in production
- Use HTTPS in production environments
- Implement proper user authentication and authorization

## Future Enhancements

To make this production-ready, consider:

1. **Persistent Database**: Add PostgreSQL, MySQL, or MongoDB
2. **User Management**: Add user registration and profile management
3. **Email Notifications**: Send booking confirmations and reminders
4. **Recurring Bookings**: Support for recurring meeting patterns
5. **Calendar Integration**: Google Calendar, Outlook integration
6. **Mobile App**: React Native or PWA version
7. **Advanced Features**: Room equipment management, approval workflows