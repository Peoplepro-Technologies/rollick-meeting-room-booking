# Local Network Setup Guide

This guide will help you run the Meeting Room Booking System on your local network so it can be accessed from other PCs.

## Prerequisites

- Node.js 18 or higher installed on the host PC
- All PCs connected to the same local network
- Host PC's local IP address

## Step 1: Find Host PC's IP Address

On the host PC (where you'll run the server):

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually something like `192.168.1.x`)

**Linux/Mac:**
```bash
ip addr show
```
Look for the `inet` address of your active network interface

## Step 2: Configure Environment Variables

### Server Configuration

Edit `server/.env`:

```bash
cd server
cp .env.example .env
```

Update `server/.env`:
```bash
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
DATABASE_URL="file:./dev.db"
FRONTEND_URL=http://HOST_PC_IP:3000
```

Replace `HOST_PC_IP` with the actual IP address you found in Step 1.

### Client Configuration

Edit `client/.env`:

```bash
cd client
cp .env.example .env
```

Update `client/.env`:
```bash
VITE_API_URL=http://HOST_PC_IP:5000/api
```

Replace `HOST_PC_IP` with the actual IP address you found in Step 1.

## Step 3: Install Dependencies

```bash
# From project root
npm run install:all
```

## Step 4: Database Setup

The application uses SQLite for persistent data storage.

### Initialize Database

```bash
cd server
npm run db:init
```

This creates:
- SQLite database file at `server/database.sqlite`
- Database tables and sample data
- Admin user: `admin@meetingroom.com` / `admin123`
- 3 sample rooms and 1 sample booking

**Note:** Data is persistent and will survive server restarts.

## Step 5: Run the Application

### Option 1: Both Services Together (Recommended)

From the project root:
```bash
npm run dev
```

This runs both servers concurrently:
- Backend: `http://HOST_PC_IP:5000`
- Frontend: `http://HOST_PC_IP:3000`

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

## Step 6: Access from Other PCs

From any other PC on the same network:

1. Open a web browser
2. Navigate to: `http://HOST_PC_IP:3000`
3. Login with: `admin@meetingroom.com` / `admin123`

Replace `HOST_PC_IP` with the actual IP address of the host PC.

## Firewall Configuration

If you can't access the application from other PCs, you may need to allow incoming connections on ports 3000 and 5000:

### Windows Firewall
1. Go to Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings"
4. Allow "Node.js" or add custom rules for ports 3000 and 5000

### Linux Firewall (UFW)
```bash
sudo ufw allow 3000
sudo ufw allow 5000
```

### Mac Firewall
1. Go to System Preferences > Security & Privacy > Firewall
2. Click "Firewall Options"
3. Add Node.js or allow incoming connections

## Troubleshooting

### Can't Access from Other PCs
1. Verify all PCs are on the same network
2. Check firewall settings on the host PC
3. Ensure the server is running with `npm run dev`
4. Test access on the host PC using `http://HOST_PC_IP:3000` (not localhost)

### CORS Errors
If you get CORS errors in the browser console:
1. Verify `FRONTEND_URL` in `server/.env` matches the IP you're using
2. Restart the server after making changes

### Database Issues
The application uses SQLite. If you encounter database-related errors:
1. Ensure the database file exists: `ls -la server/database.sqlite`
2. Check file permissions on the database file
3. Ensure no other instances are using the database file
4. Reinitialize database: `cd server && npm run db:init`

## Network Security Note

This setup is intended for trusted local networks only. Do not expose this to the internet without proper security measures.