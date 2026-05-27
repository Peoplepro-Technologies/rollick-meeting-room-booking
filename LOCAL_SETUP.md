# Meeting Room Booking - Local Development Setup

## Overview
This application consists of two separate services:
- **Backend**: Node.js/Express server running on port 5000
- **Frontend**: React/Vite application running on port 3000

## Prerequisites
- Node.js (v16 or higher)
- npm

## Installation

1. Install all dependencies:
```bash
npm run install:all
```

## Running the Application

Start both servers simultaneously:
```bash
npm run dev
```

This will start:
- Backend server: http://localhost:5000
- Frontend application: http://localhost:3000

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

## Notes
- SQLite database is automatically created on first run
- Frontend proxies API requests to backend via Vite proxy config