# Meeting Room Booking Application

A modern meeting room booking application with a Google Calendar-like interface, built with React and Express.

## Features

- **Calendar View**: Google Calendar-like interface for viewing room availability
- **Room Management**: Add, edit, and delete meeting rooms
- **Booking System**: Create, view, and manage room bookings
- **Authentication**: Secure login system with role-based access control
- **Admin Panel**: Administrative controls for managing rooms and bookings
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

### Frontend
- React.js with TypeScript
- Material-UI (MUI) for components
- FullCalendar.js for calendar view
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express.js
- SQLite database
- JWT authentication
- bcryptjs for password hashing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd meeting-room-booking
```

2. Install dependencies
```bash
npm run install:all
```

3. Set up environment variables
```bash
cp .env.example .env
```

4. Start the development server
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
meeting-room-booking/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context for state
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utility functions
│   │   ├── api/            # API client
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Express app
│   ├── migrations/         # Database migrations
│   └── package.json
├── config/                 # Configuration files
├── package.json            # Root package.json
├── .env.example            # Environment variables example
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create new room (admin only)
- `PUT /api/rooms/:id` - Update room (admin only)
- `DELETE /api/rooms/:id` - Delete room (admin only)

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/bookings/availability/check` - Check room availability

## Default Admin Account

The application comes with a default admin account:
- Username: `admin`
- Password: `admin123`

**Important**: Change the default admin password in production.

## Development

### Running in Development
```bash
npm run dev
```

This will start both the frontend and backend servers.

### Building for Production
```bash
npm run build
```

### Running in Production
```bash
npm start
```

## Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - JWT secret key

### Authentication Configuration
The authentication configuration is stored in `config/auth.json`:
- Admin credentials
- JWT settings
- Token expiration

## Security Considerations

- Change the default JWT secret in production
- Use HTTPS in production
- Implement rate limiting for authentication endpoints
- Validate all user inputs
- Use environment variables for sensitive configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License