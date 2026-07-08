# Meeting Room Booking System - Simplified Version

A simplified meeting room booking application with calendar interface, now using in-memory database instead of Prisma.

## Features

- **Room Management**: Create, view, update, and delete meeting rooms
- **Booking System**: Book rooms with time slots and calendar view; pick or change the meeting room on create/edit
- **User Authentication**: Admin and user roles with JWT authentication
- **Theme Settings**: Per-deployment color palette and text color for room tiles
- **Responsive UI**: Material-UI based interface with full calendar integration and Rollick branding
- **Docker-ready**: One command (`docker compose up`) to deploy on any machine with Docker

## Quick Start (Docker — recommended)

The fastest way to run the app on a fresh machine.

### Prerequisites
- Docker Engine 20.10+ with the Compose plugin (`docker compose`)

### Steps

```bash
git clone https://github.com/Peoplepro-Technologies/rollick-meeting-room-booking.git
cd rollick-meeting-room-booking

# Optional: set a real JWT secret before first boot
export JWT_SECRET="$(openssl rand -hex 32)"

docker compose build
docker compose up -d
```

That's it. The app is now available at:

- Web UI: <http://localhost:5000>
- API health: <http://localhost:5000/api/health>

### First-boot defaults

The container auto-creates a persistent named volume (`meeting-data`) for the SQLite database and uploaded files. On first boot it runs `db:init` which seeds:

- Admin user: `admin@rollick.co.in` / `admin123`  ← **change this in production**
- Three sample rooms (Conference Room A, Meeting Room B, Training Room)
- A sample booking on the next workday

Subsequent restarts reuse the same volume — your data persists.

### Stopping / resetting

```bash
docker compose down              # stop and remove containers, keep data
docker compose down -v           # also delete the meeting-data volume (full reset)
docker compose logs -f app       # tail logs
```

### Where things live inside the container

| Path                         | What it is                                 |
| ---------------------------- | ------------------------------------------ |
| `/data/database.sqlite`      | SQLite DB (mounted from the `meeting-data` volume) |
| `/data/uploads/`             | CSV/Excel uploads                          |
| `/app/server/`               | Server source + `node_modules`             |
| `/app/client/dist/`          | Pre-built React/Vite assets                |

## Quick Start (Local Node — for development)

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

5. **Access the application**:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000/api`

### Default Login

- **Email**: `admin@rollick.co.in`
- **Username**: `admin`
- **Password**: `admin123`

## Database

This version uses **SQLite** for persistent storage that:

- Automatically initializes with sample data
- Includes admin user, sample rooms, and bookings
- Persists data between server restarts
- Stores data in a single file (`server/database.sqlite` locally, `/data/database.sqlite` in Docker)
- Is suitable for development and small-scale production

### Database Features

- **File-based**: Single database file
- **Persistent**: Data survives server restarts
- **Easy backup**: Just copy the database file or the `meeting-data` Docker volume
- **No external services**: Embedded database

## Local Network Setup

To run the application on your local network so other PCs can access it:

1. **Find your PC's IP address**
2. **Update environment variables** to use your IP instead of localhost
3. **Start the application** with `npm run dev`
4. **Access from other PCs** using `http://YOUR_IP:3000`

See [LOCAL_NETWORK_SETUP.md](./LOCAL_NETWORK_SETUP.md) for detailed instructions.

For Docker on a LAN: bind the host port to all interfaces (the default `"5000:5000"` already does this) and open TCP 5000 on the host firewall. Reach the app at `http://<HOST_IP>:5000`.

## Project Structure

```
ROLLICK-MEETING-ROOM-BOOKING/
├── server/
│   ├── src/
│   │   ├── lib/
│   │   │   └── db.js          # SQLite database (auto-seeds admin + rooms)
│   │   ├── routes/            # API routes (auth, rooms, bookings, users, theme)
│   │   └── app.js             # Main server file
│   ├── scripts/init-database.js
│   └── package.json
├── client/
│   ├── public/                # Static assets (logo.png, …)
│   ├── src/                   # React components
│   └── vite.config.ts
├── Dockerfile                 # Multi-stage build → runtime image
├── docker-entrypoint.sh       # Seeds DB on first boot, then starts Node
├── docker-compose.yml         # One-service deploy (app + meeting-data volume)
├── .dockerignore
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

- `POST /api/auth/login` — Admin login (username/email + password)
- `POST /api/auth/login/email` — User login (email only)
- `GET  /api/auth/me` — Current user
- `GET  /api/rooms` — Get all rooms
- `POST /api/rooms` — Create room (admin)
- `PUT  /api/rooms/:id` — Update room (admin)
- `DELETE /api/rooms/:id` — Delete room (admin)
- `GET  /api/bookings` — Get bookings
- `POST /api/bookings` — Create booking (body: `title`, `room_id`, `start_time`, `end_time`)
- `PUT  /api/bookings/:id` — Update booking (`title`, `room_id`, `start_time`, `end_time`)
- `DELETE /api/bookings/:id` — Delete booking
- `GET  /api/bookings/availability/check` — Check room availability
- `GET  /api/users` — List users (admin)
- `POST /api/users` — Create user (admin)
- `PUT  /api/users/:id` — Update user (admin)
- `GET  /api/theme` — Get theme settings
- `PUT  /api/theme` — Update theme settings

## Security Notes

- Change the default JWT secret (`JWT_SECRET`) before deploying anywhere reachable from the network
- Change the seeded admin password immediately after first login
- Put the app behind a reverse proxy (Caddy / Nginx / Traefik) with TLS for anything beyond a LAN
- The SQLite DB file and uploads directory contain all persistent data — back them up