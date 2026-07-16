# Deployment

Current production deployment is Fly.io. The retired Netlify documents are intentionally removed.

## First Deployment

1. Install and authenticate the Fly CLI: `fly auth login`.
2. Create the application: `fly launch --no-deploy`.
3. Set required secrets, including `SECRET_KEY` and `FRONTEND_URL`. The attached `py_music_data` volume stores the default SQLite database at `/app/data/strubloid.db`; do not point `DATABASE_URL` at `/data` or the image filesystem. Set `DATABASE_URL` only for an external database, or set it to `sqlite:////app/data/strubloid.db` explicitly.
4. Deploy with `fly deploy`.

## Verify Before Deploy

```bash
cd frontend
npm run build
cd ..
python -m unittest backend.project.tests.test_daily_challenges
```

Locally, run Flask on port 5000 and verify `http://localhost:5000/api/health`. In production, verify the health endpoint, SPA route fallback, authentication, and current security controls from [Security](security.md).

## Architecture

- Vite builds the React frontend into `frontend/dist/`.
- Flask serves `/api/*` and the built SPA from the same service.
- Docker builds the frontend and backend; Fly routes public traffic to Flask on port 5000.

## Operations

- Deploy updates: `fly deploy`
- Status: `fly status`
- Logs: `fly logs`
- Browser: `fly open`
- Shell: `fly ssh console`

Keep database backup/recovery and dependency-audit procedures current as described in [Security](security.md).
