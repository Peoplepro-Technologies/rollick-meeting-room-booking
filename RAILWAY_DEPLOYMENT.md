# Railway Deployment Guide

This guide covers deploying the Meeting Room Booking System to Railway.

## Prerequisites

- Railway account (sign up at [railway.app](https://railway.app))
- Railway CLI installed:
  ```bash
  npm install -g @railway/cli
  ```
- Project linked to Railway:
  ```bash
  railway login
  railway link
  ```

## Database Setup

### 1. Add PostgreSQL Database

```bash
railway add postgresql
```

Railway will create a PostgreSQL database and set the `DATABASE_URL` variable automatically.

### 2. Configure Database Variables

Your server's `.railway.toml` is pre-configured to use Railway's PostgreSQL:

```toml
[build]
command = "npm install && npm run db:generate:prod"

[env]
DATABASE_PROVIDER = "postgresql"
DATABASE_URL = "{{Postgres.DATABASE_URL}}"
```

## Environment Variables

Set these environment variables in Railway:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT signing key | Generate a secure random string |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Client URL | Your Railway frontend URL |
| `DATABASE_URL` | Auto-set by Railway | `{{Postgres.DATABASE_URL}}` |

### Setting Variables via CLI

```bash
railway variables set PORT=5000
railway variables set JWT_SECRET=your-secure-random-string
railway variables set NODE_ENV=production
```

### Setting Variables via Dashboard

1. Go to your project in Railway dashboard
2. Select your service
3. Click on "Variables" tab
4. Add each variable

## Deployment Steps

### 1. Deploy the Server

```bash
# From project root
railway up
```

This will:
- Upload your code
- Install dependencies
- Generate Prisma Client for PostgreSQL
- Run migrations
- Start the server

### 2. Build the Client

The client build is handled automatically. Railway serves the built client from the `client/dist` directory.

### 3. Set Frontend URL

After deployment, get your server URL and set it as `FRONTEND_URL`:

```bash
railway variables set FRONTEND_URL=https://your-app.railway.app
```

## Migrations

Railway automatically runs migrations when you deploy. The build command in `.railway.toml` includes:

```bash
npm run db:generate:prod
```

This:
1. Copies `schema.postgresql.prisma` to `schema.prisma`
2. Generates Prisma Client for PostgreSQL

To run migrations manually:

```bash
railway run "npm run db:migrate:prod"
```

## Troubleshooting

### Build Failures

**Issue**: Prisma generation fails
```bash
# Solution: Check DATABASE_URL is set
railway variables
```

**Issue**: Port already in use
```bash
# Solution: Railway uses PORT env variable automatically
# Make sure your app listens on process.env.PORT
```

### Database Connection Issues

**Issue**: Cannot connect to database
```bash
# Check DATABASE_URL
railway variables get DATABASE_URL

# Restart service
railway up
```

### Migration Issues

**Issue**: Migrations fail to apply
```bash
# Reset database (WARNING: Deletes all data)
railway run "npx prisma migrate reset"

# Or create new migration
railway run "npx prisma migrate dev --name fix"
```

## Monitoring

### View Logs

```bash
railway logs
```

### Open Dashboard

```bash
railway open
```

### Check Status

```bash
railway status
```

## Production Considerations

1. **JWT Secret**: Generate a secure random string
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Environment**: Ensure `NODE_ENV=production`

3. **Database**: PostgreSQL is used (not SQLite)

4. **Build Artifacts**: Client is built and served from `client/dist`

## Cost Management

Railway provides free tier usage. Monitor your usage:

- Database: $5/month after free trial
- Server: Pay-per-use after free trial
- Static files: Included with server

## Scaling

To scale your service:

```bash
# Scale to 2 instances
railway scale 2
```

## Rollback

If deployment fails:

```bash
# View deployments
railway deployments

# Rollback to previous deployment
railway rollback <deployment-id>
```

## URLs After Deployment

After successful deployment, you'll have:

- **API URL**: `https://your-server.railway.app`
- **Client URL**: `https://your-server.railway.app` (served from same domain)
- **Database**: Managed internally by Railway

## Next Steps

1. Set up custom domain (Railway dashboard → Domains)
2. Configure error tracking (Sentry, etc.)
3. Set up monitoring (Railway provides built-in metrics)
4. Configure automatic backups (Railway does this automatically)
