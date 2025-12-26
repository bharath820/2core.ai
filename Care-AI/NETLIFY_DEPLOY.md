# Netlify Deployment Guide

This guide will help you deploy the Care-AI frontend to Netlify.

## Prerequisites

1. A Netlify account
2. Your backend deployed separately (Railway, Render, Vercel, etc.) or using Netlify Functions

## Deployment Options

### Option 1: Frontend Only (Recommended)

Deploy only the React frontend to Netlify, and host your backend separately.

#### Steps:

1. **Build the frontend:**
   ```bash
   npm run build:frontend
   ```

2. **Deploy to Netlify:**
   - Option A: Drag and drop the `dist/public` folder to Netlify
   - Option B: Connect your Git repository to Netlify

3. **Configure Netlify Build Settings:**
   - Build command: `npm run build:frontend`
   - Publish directory: `dist/public`
   - Node version: `20`

4. **Set Environment Variables** (if backend is on different domain):
   - `VITE_API_URL` = Your backend URL (e.g., `https://your-backend.railway.app`)

5. **Configure API Proxy** (optional):
   - Edit `netlify.toml` and uncomment the API proxy redirect
   - Replace `YOUR_BACKEND_URL` with your actual backend URL

### Option 2: Connect Git Repository

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **In Netlify:**
   - Click "New site from Git"
   - Connect your repository
   - Configure:
     - Build command: `npm run build:frontend`
     - Publish directory: `dist/public`

3. **Add Environment Variables:**
   - `VITE_API_URL` = Your backend URL (if different domain)

4. **Deploy!**

## Backend Deployment

Your backend needs to be deployed separately. Options:

- **Railway**: Great for Node.js apps with databases
- **Render**: Free tier available
- **Fly.io**: Good performance
- **Heroku**: Traditional option
- **Vercel**: Serverless functions

### Backend Environment Variables:
- `DATABASE_URL` = Path to your SQLite file or connection string
- `SESSION_SECRET` = A secure random string
- `PORT` = Port number (usually auto-assigned)
- `HOST` = `0.0.0.0` (for most platforms)

## Important Notes

1. **CORS Configuration**: If backend is on a different domain, ensure your backend allows requests from your Netlify domain.

2. **Session Cookies**: Session cookies work best when frontend and backend are on the same domain. Consider using JWT tokens if they're on different domains.

3. **File Uploads**: The `uploads/` folder needs persistent storage. Consider using cloud storage (S3, Cloudinary) for production.

4. **Database**: SQLite files need persistent storage. For production, consider PostgreSQL or another hosted database.

## Troubleshooting

### "Page Not Found" Error
- Ensure `netlify.toml` is in the root directory
- Check that `_redirects` file exists in `client/public/` and gets copied to build
- Verify publish directory is set to `dist/public`

### API Calls Failing
- Check CORS settings on backend
- Verify API URL is correct in environment variables
- Check browser console for errors

### Build Fails
- Ensure Node version is 20 or higher
- Check that all dependencies are in `package.json`
- Review build logs for specific errors



