# Render Deployment Guide

## Quick Start

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Sign in with your GitHub account
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file

3. **Deploy**
   - Render will automatically build and deploy your application
   - Your app will be available at: `https://your-service-name.onrender.com`

## What Happens During Deployment

1. **Build Phase**
   - Runs `npm run install:all` (installs root, client, and server dependencies)
   - Runs `npm run build` (builds the React client)

2. **Start Phase**
   - Runs `npm start` (starts the Express server)
   - Server serves both API and static files in production

## Environment Variables

Render automatically sets:
- `NODE_ENV=production`
- `PORT=10000`
- `JWT_SECRET` (auto-generated secure value)

## Troubleshooting

### "Cannot find package 'express'" Error
This should be fixed with the `render.yaml` configuration. If you still see this error:

1. Ensure `render.yaml` is in your root directory
2. Verify `npm run install:all` is in your build command
3. Check that all dependencies are in the correct `package.json` files

### CORS Issues in Production
The server is configured to handle CORS automatically:
- Development: Allows all origins
- Production: Only allows the configured frontend URL

### Database Issues
The SQLite database is created automatically on first deployment:
- Location: `database.sqlite` in project root
- Seeded with default admin account
- Persists between deployments

## Post-Deployment

1. **Test Your Application**
   - Visit your Render URL
   - Try logging in with the default admin account:
     - Username: `admin`
     - Password: `admin123`

2. **Change Default Password**
   - Immediately change the default admin password
   - Use the admin panel to create new users

3. **Monitor Logs**
   - Use Render's dashboard to monitor application logs
   - Check for any errors or warnings

## Custom Domain

To use a custom domain:

1. **In Render Dashboard**
   - Go to your service settings
   - Add your custom domain
   - Follow the DNS instructions

2. **Update Frontend URL (Optional)**
   - Set `FRONTEND_URL` environment variable in Render
   - This ensures CORS works correctly with your custom domain

## Scaling

For production use:

1. **Upgrade Plan**
   - Consider upgrading from the free plan for better performance
   - Free plan has limitations on CPU and memory

2. **Database Considerations**
   - For high-traffic applications, consider migrating to PostgreSQL
   - SQLite is suitable for small to medium applications

3. **Caching**
   - Consider adding Redis for session storage
   - Implement API response caching for better performance