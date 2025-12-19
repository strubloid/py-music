# Fly.io Deployment Guide

## Prerequisites
- Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
- Login to Fly.io: `fly auth login`

## First Time Deployment

1. **Launch the app (creates app on Fly.io)**
   ```bash
   fly launch --no-deploy
   ```
   This will ask you to:
   - Choose an app name (or use auto-generated)
   - Select a region (current: lhr - London)
   - Confirm Dockerfile detection

2. **Set environment variables (if needed)**
   ```bash
   fly secrets set OPENAI_API_KEY=your_key_here
   fly secrets set ANTHROPIC_API_KEY=your_key_here
   ```

3. **Deploy the application**
   ```bash
   fly deploy
   ```

## Updating the App

After making changes, deploy with:
```bash
fly deploy
```

## Useful Commands

- **Check app status**: `fly status`
- **View logs**: `fly logs`
- **Open app in browser**: `fly open`
- **SSH into app**: `fly ssh console`
- **Check app info**: `fly info`
- **Scale app**: `fly scale count 1` (or 0 to stop)

## Local Testing

Before deploying, test locally:

1. **Build frontend**:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   npm run build
   cd ..
   ```

2. **Run Flask server**:
   ```bash
   python -m flask --app backend.project.api.app run --host=0.0.0.0 --port=5000
   ```

3. **Test**:
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api/health

## Architecture

- **Frontend**: React + Vite (built to `frontend/dist/`)
- **Backend**: Flask serving both API and static files
- **API Routes**: `/api/*`
- **Static Routes**: All other routes serve frontend (SPA routing)

## Deployment Flow

1. Docker builds frontend using Node.js (multi-stage build)
2. Docker builds Python backend with Flask
3. Frontend dist copied to backend container
4. Flask serves both API and static files on port 5000
5. Fly.io routes all traffic to Flask

## Troubleshooting

- **Build fails**: Check Dockerfile syntax and paths
- **App crashes**: Check logs with `fly logs`
- **API not working**: Verify routes in `backend/project/api/app.py`
- **Frontend not loading**: Check `frontend/dist` exists after build
- **Memory issues**: Increase VM memory in `fly.toml` (currently 1GB)
