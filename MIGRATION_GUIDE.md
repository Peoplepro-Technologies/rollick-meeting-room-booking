# Migration Guide: SQLite to Prisma

## Overview
This guide explains how the application has been migrated from raw SQLite to Prisma ORM with dual database support (SQLite for development, PostgreSQL for production).

## Changes Made

### 1. Prisma Schema
- Created `prisma/schema.prisma` with all database models
- Models: User, Room, Booking, ThemeSetting
- Proper relationships and constraints defined

### 2. Database Configuration
- Added `DATABASE_PROVIDER` environment variable
- Local: `sqlite` with file URL
- Production: `postgresql` with Railway's database URL

### 3. Updated Dependencies
- Removed `sqlite3`
- Added `@prisma/client` and `prisma`
- Updated scripts to include Prisma commands

### 4. Database Client
- Created `src/lib/db.js` for Prisma client initialization
- Singleton pattern for optimal performance

### 5. Data Access Layer
- Replaced raw SQL queries with Prisma Client methods
- All routes updated to use Prisma instead of direct SQLite calls

### 6. Migration System
- Railway automatically handles PostgreSQL provisioning
- Local development uses SQLite with same schema

## Environment Setup

### Local Development
```env
DATABASE_PROVIDER=sqlite
DATABASE_URL="file:./dev.db"
```

### Production (Railway)
```env
DATABASE_PROVIDER=postgresql
DATABASE_URL="{{Postgres.DATABASE_URL}}"
```

## Database Commands

### Local Development
```bash
# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Open database GUI
npm run db:studio
```

### Railway Deployment
- PostgreSQL service automatically created
- Database migrations run on deployment
- No manual setup required

## Route Updates

All routes have been updated to use Prisma:
- **Authentication**: Uses `db.user.findUnique()`
- **Users**: CRUD operations with Prisma
- **Rooms**: Full CRUD support
- **Bookings**: Includes relations and availability checks

## Benefits
1. **Type Safety**: Prisma provides TypeScript types
2. **Database Agnostic**: Works with SQLite and PostgreSQL
3. **Better Performance**: Connection pooling and optimized queries
4. **Developer Experience**: Prisma Studio for database management
5. **Production Ready**: PostgreSQL on Railway for scalability

## Migration Steps for Existing Projects

1. Install Prisma:
```bash
npm install prisma @prisma/client
npm install -D prisma
```

2. Initialize Prisma:
```bash
npx prisma init
```

3. Create schema file with your models

4. Generate client:
```bash
npx prisma generate
```

5. Create initial migration:
```bash
npx prisma migrate dev --name init
```

6. Update all database access code to use Prisma Client

7. Configure environment variables for dual database support

8. Test both SQLite and PostgreSQL configurations

## Troubleshooting

### Common Issues

1. **Prisma Client Generation**
   - Always run `prisma generate` after schema changes
   - Client must be regenerated when models change

2. **Migration Errors**
   - Ensure no pending migrations before deploying
   - Use `prisma migrate resolve` to handle migration issues

3. **Database Connection**
   - Verify environment variables are set correctly
   - Check database URL format for your provider

### Debug Mode
Enable debug logging:
```env
DEBUG=prisma:* node src/app.js
```