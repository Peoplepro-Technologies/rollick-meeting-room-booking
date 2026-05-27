# Meeting Room Booking System

A full-stack meeting room reservation application with calendar interface, user authentication, and admin management.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 18, TypeScript, Material-UI, Vite |
| **Backend** | Express.js, Prisma ORM |
| **Database** | SQLite (local) / PostgreSQL (Railway) |
| **Calendar** | FullCalendar |
| **Auth** | JWT (bcrypt) |

## Features

- **Calendar Interface**: View and manage bookings by room
- **User Authentication**: Role-based access (admin/user)
- **Room Management**: Multiple meeting rooms with capacities
- **Booking System**: Create, view, and cancel reservations
- **Admin Panel**: User and room management
- **Theme Customization**: Palette and text color options

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ROLLICK-MEETING-ROOM-BOOKING
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   # Root directory
   cp .env.example .env
   
   # Server directory
   cd server
   cp .env.example .env
   ```

4. **Initialize database (local)**
   ```bash
   cd server
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

## Running the Application

### Development (Both Frontend & Backend)
```bash
npm run dev
```
This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

### Individual Services

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm run dev
```

## Default Admin Account

- **Email**: `admin@meetingroom.com`
- **Password**: `admin123`

> ⚠️ **Change this password in production!**

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/me` | GET | Get current user |
| `/api/bookings` | GET/POST | List/create bookings |
| `/api/bookings/:id` | DELETE | Cancel booking |
| `/api/rooms` | GET | List all rooms |
| `/api/users` | GET | List all users (admin) |
| `/api/theme` | GET/PUT | Theme settings |

## Database Management

**Generate Prisma Client:**
```bash
cd server
npm run db:generate
```

**Run Migrations:**
```bash
cd server
npm run db:migrate
```

**Open Prisma Studio:**
```bash
cd server
npm run db:studio
```

**Seed Database:**
```bash
cd server
npm run db:seed
```

## Railway Deployment

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed deployment instructions.

Quick deploy:
```bash
railway up
```

## Project Structure

```
ROLLICK-MEETING-ROOM-BOOKING/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Login, Dashboard, Admin
│   │   ├── components/    # Calendar, BookingForm, etc.
│   │   ├── api/           # Axios client
│   │   └── context/       # AuthContext
│   └── dist/              # Build output
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   └── lib/           # Database client
│   └── prisma/            # Database schema & migrations
└── README.md
```

## Environment Variables

### Server (.env)
```bash
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
DATABASE_URL="file:./server/database.sqlite"
FRONTEND_URL=http://localhost:3000
```

### Client (.env)
```bash
VITE_API_URL=http://localhost:5000/api
```

## License

MIT
