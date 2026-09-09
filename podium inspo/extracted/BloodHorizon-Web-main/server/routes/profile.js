import { Router } from 'express';
import pool from '../db.js';
import { getLiveServerState, isPlayerOnline } from '../lib/live-server.js';
import { getSteamSummaries } from '../lib/steam.js';
import { formatRelativeTime } from '../lib/time.js';

const router = Router();

const STAT_COLUMNS = [
  'Kills',
  'Headshots',
  'PVPDeaths',
  'PVEDeaths',
  'Zombies',
  'MegaZombies',
  'Animals',
  'Resources',
  'Harvests',
  'Fish',
  'Structures',
  'Barricades',
  'Playtime',
  'LastUpdated',
];

function requireAuth(req, res, next) {
  if (!req.isAuthenticated?.() || !req.user?.steamId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

function numberValue(value) {
  return Number(value || 0);
}

function buildPlayerPayload(stats, steamId, steamSummary, fallbackName, rank) {
  return {
    SteamId: String(stats?.SteamId || steamId),
    Name: steamSummary?.personaName || stats?.Name || fallbackName || 'Unknown Player',
    Kills: numberValue(stats?.Kills),
    Headshots: numberValue(stats?.Headshots),
    PVPDeaths: numberValue(stats?.PVPDeaths),
    PVEDeaths: numberValue(stats?.PVEDeaths),
    Zombies: numberValue(stats?.Zombies),
    MegaZombies: numberValue(stats?.MegaZombies),
    Animals: numberValue(stats?.Animals),
    Resources: numberValue(stats?.Resources),
    Harvests: numberValue(stats?.Harvests),
    Fish: numberValue(stats?.Fish),
    Structures: numberValue(stats?.Structures),
    Barricades: numberValue(stats?.Barricades),
    Playtime: numberValue(stats?.Playtime),
    Rank: rank ?? null,
    LastUpdated: stats?.LastUpdated || null,
    AvatarUrl: steamSummary?.avatarUrl || null,
    ProfileUrl: steamSummary?.profileUrl || `https://steamcommunity.com/profiles/${steamId}`,
  };
}

function buildPerServer(playerStats, liveServer) {
  if (!liveServer?.id) {
    return [];
  }

  return [{
    serverId: liveServer.id,
    serverName: liveServer.name,
    map: liveServer.map,
    kills: numberValue(playerStats?.Kills),
    headshots: numberValue(playerStats?.Headshots),
    pvpDeaths: numberValue(playerStats?.PVPDeaths),
    zombies: numberValue(playerStats?.Zombies),
    playtimeSeconds: numberValue(playerStats?.Playtime),
  }];
}

function buildFallbackProfile(req, steamId, steamSummary, liveServer) {
  return {
    player: buildPlayerPayload(
      null,
      steamId,
      steamSummary,
      req.user?.displayName,
      null,
    ),
    lastSeen: 'No stats yet',
    linkedAccounts: {
      steamId,
      discordId: null,
    },
    perServer: buildPerServer(null, liveServer),
  };
}

async function fetchPlayerStats(steamId) {
  const [rows] = await pool.query(`
    SELECT
      CAST(SteamId AS CHAR) AS SteamId,
      Name,
      ${STAT_COLUMNS.join(',\n      ')}
    FROM PlayerStats
    WHERE SteamId = ?
    LIMIT 1
  `, [steamId]);

  return rows?.[0] || null;
}

async function fetchKillsRank(steamId) {
  const [rankRows] = await pool.query(`
    SELECT COUNT(*) + 1 AS Rank
    FROM PlayerStats
    WHERE Kills > (SELECT COALESCE(Kills, 0) FROM PlayerStats WHERE SteamId = ?)
  `, [steamId]);

  return rankRows?.[0]?.Rank || 1;
}

async function buildProfileResponse({ steamId, fallbackName, linkedDiscordId = null, req }) {
  const [steamSummaries, liveServer] = await Promise.all([
    getSteamSummaries([steamId]),
    getLiveServerState(),
  ]);

  const steamSummary = steamSummaries.get(steamId);
  let playerStats = null;
  let rank = null;

  try {
    playerStats = await fetchPlayerStats(steamId);
    if (playerStats) {
      rank = await fetchKillsRank(steamId);
    }
  } catch (error) {
    console.error('[Profile] DB lookup failed:', error.message);
  }

  if (!playerStats) {
    return buildFallbackProfile(req, steamId, steamSummary, liveServer);
  }

  const online = isPlayerOnline(liveServer, steamId);

  return {
    player: buildPlayerPayload(playerStats, steamId, steamSummary, fallbackName, rank),
    lastSeen: online ? 'Online now' : formatRelativeTime(playerStats.LastUpdated),
    linkedAccounts: {
      steamId,
      discordId: linkedDiscordId,
    },
    perServer: buildPerServer(playerStats, liveServer),
  };
}

router.get('/me', requireAuth, async (req, res) => {
  try {
    const steamId = String(req.user.steamId || '').trim();
    const payload = await buildProfileResponse({
      steamId,
      fallbackName: req.user.displayName,
      linkedDiscordId: null,
      req,
    });

    return res.json(payload);
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.get('/:steamId', async (req, res) => {
  try {
    const { steamId } = req.params;

    if (!/^\d{17}$/.test(steamId)) {
      return res.status(400).json({ error: 'Invalid Steam ID format' });
    }

    const payload = await buildProfileResponse({
      steamId,
      fallbackName: null,
      linkedDiscordId: null,
      req,
    });

    if (!payload?.player?.SteamId) {
      return res.status(404).json({ error: 'Player not found' });
    }

    return res.json(payload);
  } catch (error) {
    console.error('Public profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
