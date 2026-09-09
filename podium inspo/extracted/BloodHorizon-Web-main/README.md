# Blood Horizon Website Deploy / Update / Restart Guide

## Paths to remember

Use these exact paths on your VPS:

- Project source: `/opt/bloodhorizon`
- Backend source: `/opt/bloodhorizon/server`
- Live frontend files served by Nginx: `/var/www/bloodhorizon.asia`
- Nginx site config: `/etc/nginx/sites-available/bloodhorizon.asia`
- Nginx enabled symlink: `/etc/nginx/sites-enabled/bloodhorizon.asia`

## Files you edit

### Frontend source
Edit these inside:
`/opt/bloodhorizon`

Examples:
- `src/pages/...`
- `src/components/...`
- `src/lib/...`
- `index.html`
- `.env.production`

### Backend source
Edit these inside:
`/opt/bloodhorizon/server`

Examples:
- `routes/...`
- `lib/...`
- `index.js`
- `.env`

## Important rule

Frontend and backend are different:

- If you change **frontend code or frontend env**, you must **rebuild**
- If you change **backend code or backend env**, you must **restart backend**

---

# 1) Frontend-only changes

Examples:
- changed UI
- changed page layout
- changed React/TS files
- changed `index.html`
- changed favicon / OG meta tags
- changed `.env.production`

## Commands

```bash
cd /opt/bloodhorizon
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx
```

## What this does
- builds fresh frontend files
- copies built site to the live web folder
- reloads Nginx

You do **not** need to restart the backend for frontend-only changes.

---

# 2) Backend-only changes

Examples:
- changed routes
- changed DB logic
- changed API logic
- changed `server/.env`
- changed auth or bot-linking code

## Commands

```bash
cd /opt/bloodhorizon/server
pm2 restart bloodhorizon-api
```

If PM2 is not found:

```bash
npm install -g pm2
hash -r
pm2 restart bloodhorizon-api
```

## Useful checks

```bash
pm2 status
pm2 logs bloodhorizon-api --lines 50
curl http://127.0.0.1:4000/api/health
```

---

# 3) Frontend + backend changes

If you changed both website UI and server code:

```bash
cd /opt/bloodhorizon
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx

cd /opt/bloodhorizon/server
pm2 restart bloodhorizon-api
```

---

# 4) If you pull new changes from GitHub

Go to the project folder first:

```bash
cd /opt/bloodhorizon
git pull origin main
```

Then decide what changed.

## If only frontend changed
```bash
npm install
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx
```

## If backend changed too
```bash
cd /opt/bloodhorizon/server
npm install
pm2 restart bloodhorizon-api
```

## Safe full refresh after a pull
If you do not want to guess:

```bash
cd /opt/bloodhorizon
npm install
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx

cd /opt/bloodhorizon/server
npm install
pm2 restart bloodhorizon-api
```

---

# 5) Env files and where they go

## Frontend production env
File:
`/opt/bloodhorizon/.env.production`

Example:
```env
VITE_API_BASE_URL=https://bloodhorizon.asia/api
VITE_STEAM_LOGIN_URL=https://bloodhorizon.asia/api/auth/steam/login
```

If this file changes, you must rebuild frontend.

## Backend env
File:
`/opt/bloodhorizon/server/.env`

If this file changes, you must restart backend.

---

# 6) Common scenarios

## Scenario A — I changed only text, styling, or a page
Do this:

```bash
cd /opt/bloodhorizon
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx
```

## Scenario B — I changed API/backend logic
Do this:

```bash
cd /opt/bloodhorizon/server
pm2 restart bloodhorizon-api
```

## Scenario C — I changed frontend env like API URL
Do this:

```bash
cd /opt/bloodhorizon
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx
```

## Scenario D — I changed backend env like DB, Discord, Steam, Pterodactyl
Do this:

```bash
cd /opt/bloodhorizon/server
pm2 restart bloodhorizon-api
```

## Scenario E — I want to deploy from fresh GitHub changes
Do this:

```bash
cd /opt/bloodhorizon
git pull origin main
npm install
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx

cd /opt/bloodhorizon/server
npm install
pm2 restart bloodhorizon-api
```

---

# 7) Health checks

## Check backend directly
```bash
curl http://127.0.0.1:4000/api/health
```

## Check through the domain
```bash
curl https://bloodhorizon.asia/api/health
```

## Check PM2
```bash
pm2 status
pm2 logs bloodhorizon-api --lines 50
```

## Check Nginx config
```bash
nginx -t
```

## Reload Nginx
```bash
systemctl reload nginx
```

---

# 8) If website changes do not show up

Usually one of these:
- forgot to run `npm run build`
- forgot to copy `dist` to `/var/www/bloodhorizon.asia`
- browser cache
- Cloudflare cache

Do this first:

```bash
cd /opt/bloodhorizon
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx
```

Then hard refresh browser.

If Cloudflare is proxied, purge cache if needed.

---

# 9) If backend changes do not show up

Usually:
- forgot to restart PM2
- wrong `.env`
- backend crashed on boot

Check:

```bash
pm2 restart bloodhorizon-api
pm2 logs bloodhorizon-api --lines 100
curl http://127.0.0.1:4000/api/health
```

---

# 10) If you want to stop the site temporarily

## Stop backend only
```bash
pm2 stop bloodhorizon-api
```

## Start backend again
```bash
pm2 start bloodhorizon-api
```

## Restart backend
```bash
pm2 restart bloodhorizon-api
```

## Stop Nginx site completely
```bash
rm /etc/nginx/sites-enabled/bloodhorizon.asia
nginx -t
systemctl reload nginx
```

## Re-enable Nginx site
```bash
ln -s /etc/nginx/sites-available/bloodhorizon.asia /etc/nginx/sites-enabled/bloodhorizon.asia
nginx -t
systemctl reload nginx
```

---

# 11) One-command quick deploy

If you changed the frontend and maybe backend too, this is the lazy safe version:

```bash
cd /opt/bloodhorizon
git pull origin main
npm install
npm run build
rm -rf /var/www/bloodhorizon.asia/*
cp -r dist/. /var/www/bloodhorizon.asia/
systemctl reload nginx

cd /opt/bloodhorizon/server
npm install
pm2 restart bloodhorizon-api
```

---

# 12) Golden rule

- Frontend change = **build + copy**
- Backend change = **restart PM2**
- Env frontend = **build again**
- Env backend = **restart again**

That is the whole mental model.
