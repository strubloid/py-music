# Netlify Deployment Guide

## 🚀 Deploying to Netlify (Full-Stack)

This project uses Netlify for both frontend (React/Vite) and backend (Python Serverless Functions).

### Prerequisites
1. GitHub/GitLab account with this repository
2. Netlify account (free tier works)

### Project Structure
```
py-music/
├── frontend/          # React/Vite app
├── netlify/
│   └── functions/     # Python serverless functions
├── src/              # Python backend logic
├── netlify.toml      # Netlify configuration
├── requirements.txt  # Python dependencies
└── runtime.txt       # Python version
```

### Setup Steps

#### 1. Push to Git
```bash
git add .
git commit -m "Netlify deployment setup"
git push origin main
```

#### 2. Connect to Netlify
1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your Git provider (GitHub/GitLab)
4. Select this repository

#### 3. Configure Build Settings
Netlify should auto-detect the settings from `netlify.toml`, but verify:

- **Base directory**: (leave empty or set to root)
- **Build command**: `cd frontend && npm install && npm run build`
- **Publish directory**: `frontend/dist`
- **Functions directory**: `netlify/functions`

#### 4. Environment Variables (Optional)
If you're using OpenAI/Anthropic for the LLM features:
- Go to **Site settings** → **Environment variables**
- Add:
  ```
  OPENAI_API_KEY=your_key_here
  ANTHROPIC_API_KEY=your_key_here
  ```

#### 5. Deploy
Click **"Deploy site"** - Netlify will:
1. Install Node.js dependencies
2. Build the React frontend
3. Install Python dependencies
4. Deploy serverless functions
5. Assign you a URL like `your-app.netlify.app`

### API Endpoints

Once deployed, your API will be available at:
```
https://your-app.netlify.app/api/health
https://your-app.netlify.app/api/scale?key=C&interval=major
https://your-app.netlify.app/api/chord-progressions?key=G&interval=minor
https://your-app.netlify.app/api/secondary-dominants?key=D&interval=major
https://your-app.netlify.app/api/intervals
https://your-app.netlify.app/api/keys
https://your-app.netlify.app/api/music-config
```

### Local Development

To test locally with Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Run dev server (serves both frontend and functions)
netlify dev
```

This will start:
- Frontend: http://localhost:3000
- Functions: http://localhost:3000/.netlify/functions/*

### Frontend API Configuration

The frontend automatically uses relative paths (`/api/*`) which Netlify redirects to the serverless functions. No environment variables needed!

### Troubleshooting

**Build fails:**
- Check the build logs in Netlify dashboard
- Verify all dependencies are in `requirements.txt` and `package.json`

**Functions timeout:**
- Netlify Functions have a 10-second timeout on free tier
- Complex music theory calculations should complete within this

**CORS errors:**
- All functions include `Access-Control-Allow-Origin: *` headers
- Should work automatically

**Python import errors:**
- Verify the path setup in each function file
- Make sure `src` directory is included in deployment

### Custom Domain (Optional)

1. Go to **Site settings** → **Domain management**
2. Add your custom domain
3. Update DNS records as instructed by Netlify

### Continuous Deployment

Every push to your main branch will automatically:
1. Trigger a new build
2. Deploy if successful
3. Update your live site

### Cost
- **Frontend**: Free (unlimited bandwidth on free tier)
- **Functions**: 125k requests/month free
- **Build minutes**: 300 minutes/month free

This should be more than enough for a music theory app!
---

## 🎵 Features Available in Production

✅ Scale Analysis (Major/Minor)
✅ Chord Progressions
✅ Secondary Dominants
✅ Interactive Chord Display
✅ Chord Diagram Toggle
✅ PDF Export
✅ Music Production Editor

---

**Need help?** Check Netlify docs: https://docs.netlify.com
