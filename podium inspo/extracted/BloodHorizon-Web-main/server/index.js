import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import passport from 'passport';
import { Strategy as SteamStrategy } from 'passport-steam';

import pool from './db.js';
import authRoutes from './routes/auth.js';
import statsRoutes from './routes/stats.js';
import profileRoutes from './routes/profile.js';
import linkRoutes from './routes/link.js';

const app = express();
const PORT = process.env.PORT || 3001;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const localFrontend = /localhost|127\.0\.0\.1/i.test(frontendUrl);
const isProduction = process.env.NODE_ENV === 'production' && !localFrontend;
const sessionName = process.env.SESSION_COOKIE_NAME || 'connect.sid';
const trustProxy = Number(process.env.TRUST_PROXY || 0);
const sessionSecure = process.env.SESSION_SECURE != null
  ? String(process.env.SESSION_SECURE).toLowerCase() === 'true'
  : isProduction;
const steamConfigured = Boolean(process.env.STEAM_RETURN_URL && process.env.STEAM_REALM && process.env.STEAM_API_KEY);

async function testDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Database connection successful');
    return true;
  } catch (error) {
    console.error('[DB] Database connection FAILED:', error.message);
    return false;
  }
}

if (trustProxy > 0) {
  app.set('trust proxy', trustProxy);
}

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

app.use(express.json());

app.use(session({
  name: sessionName,
  secret: process.env.SESSION_SECRET || 'blood-horizon-dev-secret',
  resave: false,
  saveUninitialized: false,
  proxy: trustProxy > 0,
  cookie: {
    httpOnly: true,
    sameSite: process.env.SESSION_SAME_SITE || (isProduction ? 'none' : 'lax'),
    secure: sessionSecure,
    maxAge: 24 * 60 * 60 * 1000,
    ...(process.env.SESSION_COOKIE_DOMAIN ? { domain: process.env.SESSION_COOKIE_DOMAIN } : {}),
  },
}));

app.use(passport.initialize());
app.use(passport.session());

if (steamConfigured) {
  passport.use(new SteamStrategy({
    returnURL: process.env.STEAM_RETURN_URL,
    realm: process.env.STEAM_REALM,
    apiKey: process.env.STEAM_API_KEY,
  }, (identifier, profile, done) => {
    const user = {
      steamId: profile.id,
      displayName: profile.displayName,
      avatar: profile.photos?.[2]?.value || profile.photos?.[0]?.value || null,
      profileUrl: profile._json?.profileurl || `https://steamcommunity.com/profiles/${profile.id}`,
    };
    return done(null, user);
  }));
} else {
  console.warn('[AUTH] Steam auth disabled: missing STEAM_RETURN_URL / STEAM_REALM / STEAM_API_KEY');
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use('/api/auth', authRoutes);
app.use('/api', statsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/link', linkRoutes);

app.get('/api/health', async (_req, res) => {
  const dbOk = await testDatabaseConnection();
  res.json({
    status: dbOk ? 'ok' : 'degraded',
    database: dbOk ? 'connected' : 'disconnected',
    steamAuth: steamConfigured ? 'configured' : 'disabled',
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

(async () => {
  console.log('[SERVER] Starting Blood Horizon API...');

  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn('[SERVER] Warning: Starting without database connection');
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Blood Horizon API running on port ${PORT}`);
    console.log(`[SERVER] Frontend URL: ${frontendUrl}`);
    console.log(`[SERVER] Environment: ${isProduction ? 'production' : 'development'}`);
  });
})();
