import { Router } from 'express';
import passport from 'passport';

const router = Router();
const steamConfigured = Boolean(process.env.STEAM_RETURN_URL && process.env.STEAM_REALM && process.env.STEAM_API_KEY);

function getInitials(name) {
  if (!name) return 'BH';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

router.get('/session', (req, res) => {
  try {
    if (req.isAuthenticated() && req.user) {
      return res.json({
        authenticated: true,
        user: {
          steamId: req.user.steamId,
          displayName: req.user.displayName,
          avatarUrl: req.user.avatar,
          avatarInitials: getInitials(req.user.displayName),
          lastSeen: 'Session active',
          profileUrl: req.user.profileUrl,
        },
      });
    }
    return res.json({ authenticated: false, user: null });
  } catch (error) {
    console.error('Session error:', error);
    return res.status(500).json({ error: 'Failed to get session' });
  }
});

router.get('/steam/login', (req, res, next) => {
  if (!steamConfigured) {
    return res.status(503).json({ error: 'Steam auth is not configured yet' });
  }

  const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : '/profile';
  req.session.returnTo = returnTo;

  passport.authenticate('steam', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' })(req, res, next);
});

router.get('/steam/callback',
  (req, res, next) => {
    if (!steamConfigured) {
      return res.status(503).json({ error: 'Steam auth is not configured yet' });
    }
    return next();
  },
  passport.authenticate('steam', { failureRedirect: process.env.FRONTEND_URL || 'http://localhost:5173' }),
  (req, res) => {
    const returnTo = req.session.returnTo || '/profile';
    delete req.session.returnTo;
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}${returnTo}`;
    res.redirect(redirectUrl);
  },
);

router.post('/logout', (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error('Session destroy error:', sessionErr);
          return res.status(500).json({ error: 'Failed to destroy session' });
        }

        res.clearCookie(process.env.SESSION_COOKIE_NAME || 'connect.sid', {
          ...(process.env.SESSION_COOKIE_DOMAIN ? { domain: process.env.SESSION_COOKIE_DOMAIN } : {}),
        });
        return res.json({ success: true });
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Failed to logout' });
  }
});

export default router;
