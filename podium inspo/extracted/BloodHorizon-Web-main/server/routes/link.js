import crypto from "crypto";
import { Router } from "express";

const router = Router();

function requireSteamAuth(req, res, next) {
  if (!req.isAuthenticated() || !req.user?.steamId) {
    return res.status(401).json({ error: 'Not logged in with Steam' });
  }
  return next();
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getFrontendRedirect(req, status) {
  const base = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/link?discord=${encodeURIComponent(status)}`;
}

router.get('/discord/start', requireSteamAuth, (req, res) => {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET || !process.env.DISCORD_REDIRECT_URI) {
    return res.status(503).json({ error: 'Discord OAuth is not configured yet' });
  }

  const state = crypto.randomBytes(24).toString('hex');
  req.session.discordLinkState = state;

  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    scope: 'identify',
    state,
    prompt: 'consent',
  });

  return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get('/discord/callback', requireSteamAuth, async (req, res) => {
  try {
    const code = String(req.query.code || '');
    const state = String(req.query.state || '');

    if (!code || !state || state !== req.session.discordLinkState) {
      return res.redirect(getFrontendRedirect(req, 'invalid_state'));
    }

    delete req.session.discordLinkState;

    const tokenBody = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenBody.toString(),
    });

    if (!tokenResponse.ok) {
      const body = await tokenResponse.text();
      console.error('[Link] Discord token exchange failed:', body);
      return res.redirect(getFrontendRedirect(req, 'token_failed'));
    }

    const tokenData = await tokenResponse.json();
    const meResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!meResponse.ok) {
      const body = await meResponse.text();
      console.error('[Link] Discord user lookup failed:', body);
      return res.redirect(getFrontendRedirect(req, 'user_failed'));
    }

    const me = await meResponse.json();
    const botResponse = await fetch(`${process.env.BOT_API_BASE}/api/link_oauth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: process.env.BOT_SHARED_API_KEY,
        SteamId: req.user.steamId,
        DiscordId: me.id,
        PlayerName: req.user.displayName || 'Unknown',
      }),
    });

    const botData = await safeJson(botResponse);
    if (!botResponse.ok) {
      console.error('[Link] Bot link failed:', botData);
      return res.redirect(getFrontendRedirect(req, 'link_failed'));
    }

    return res.redirect(getFrontendRedirect(req, 'linked'));
  } catch (error) {
    console.error('[Link] Discord callback failed:', error);
    return res.redirect(getFrontendRedirect(req, 'error'));
  }
});

router.get('/status', requireSteamAuth, async (req, res) => {
  try {
    const response = await fetch(`${process.env.BOT_API_BASE}/api/is_linked`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: process.env.BOT_SHARED_API_KEY,
        SteamId: req.user.steamId,
      }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      return res.status(response.status).json({
        linked: false,
        status: 'error',
        message: typeof data?.Message === 'string' ? data.Message : 'Unable to check link status',
      });
    }

    return res.json({
      linked: Boolean(data?.Linked),
      status: 'success',
      message: typeof data?.Message === 'string' ? data.Message : undefined,
    });
  } catch (error) {
    console.error('[Link] Status check failed:', error);
    return res.status(500).json({ linked: false, status: 'error', message: 'Unable to reach bot API' });
  }
});

router.post('/unlink', requireSteamAuth, async (req, res) => {
  try {
    const response = await fetch(`${process.env.BOT_API_BASE}/api/unlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ApiKey: process.env.BOT_SHARED_API_KEY,
        SteamId: req.user.steamId,
      }),
    });

    const data = await safeJson(response);
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: typeof data?.Message === 'string' ? data.Message : 'Failed to unlink account',
      });
    }

    return res.json({
      success: true,
      message: typeof data?.Message === 'string' ? data.Message : 'Discord account unlinked',
    });
  } catch (error) {
    console.error('[Link] Unlink failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to reach bot API' });
  }
});

export default router;
