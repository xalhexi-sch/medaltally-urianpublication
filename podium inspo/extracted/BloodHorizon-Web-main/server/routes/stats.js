import { Router } from 'express';
import pool from '../db.js';
import { getLiveServerState } from '../lib/live-server.js';
import { getSteamSummaries } from '../lib/steam.js';

const router = Router();
const MAX_LEADERBOARD_PLAYERS = 100;

async function fetchAggregateStats() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) AS totalPlayers,
        COALESCE(SUM(Kills), 0) AS totalKills,
        COALESCE(SUM(PVPDeaths), 0) AS totalDeaths,
        COALESCE(SUM(Playtime), 0) AS totalPlaytime
      FROM PlayerStats
    `);

    const stats = rows?.[0] || {};
    return {
      totalPlayers: Number(stats.totalPlayers || 0),
      totalKills: Number(stats.totalKills || 0),
      totalDeaths: Number(stats.totalDeaths || 0),
      totalPlaytimeSeconds: Number(stats.totalPlaytime || 0),
      databaseConnected: true,
    };
  } catch (error) {
    console.error('[Overview] DB aggregate failed:', error.message);
    return {
      totalPlayers: 0,
      totalKills: 0,
      totalDeaths: 0,
      totalPlaytimeSeconds: 0,
      databaseConnected: false,
    };
  }
}

function enrichLeaderboardRow(row, steamSummary, index, offset) {
  const steamId = String(row.SteamId || '');
  const name = steamSummary?.personaName || row.Name || `Player ${offset + index + 1}`;

  return {
    Rank: offset + index + 1,
    SteamId: steamId,
    Name: name,
    Kills: Number(row.Kills || 0),
    Headshots: Number(row.Headshots || 0),
    PVPDeaths: Number(row.PVPDeaths || 0),
    Zombies: Number(row.Zombies || 0),
    Playtime: Number(row.Playtime || 0),
    KDRatio: Number(row.KDRatio || 0),
    AvatarUrl: steamSummary?.avatarUrl || null,
    ProfileUrl: steamSummary?.profileUrl || (steamId ? `https://steamcommunity.com/profiles/${steamId}` : null),
  };
}

router.get('/overview', async (_req, res) => {
  try {
    const [stats, liveServer] = await Promise.all([
      fetchAggregateStats(),
      getLiveServerState(),
    ]);

    return res.json({
      playersOnline: Number(liveServer.playersOnline || 0),
      serversOnline: liveServer.status === 'online' ? 1 : 0,
      maxSlots: Number(liveServer.maxPlayers || 0),
      totalPlayers: stats.totalPlayers,
      totalKills: stats.totalKills,
      totalDeaths: stats.totalDeaths,
      totalPlaytimeSeconds: stats.totalPlaytimeSeconds,
      liveSource: liveServer.source,
      databaseConnected: stats.databaseConnected,
    });
  } catch (error) {
    console.error('Overview error:', error);
    return res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

router.get('/servers', async (_req, res) => {
  try {
    const liveServer = await getLiveServerState();
    const steamIds = liveServer.playerList.map((player) => player.SteamId).filter(Boolean);
    const summaries = await getSteamSummaries(steamIds);

    const playerList = liveServer.playerList.map((player) => {
      const summary = summaries.get(player.SteamId);
      return {
        SteamId: player.SteamId,
        SteamName: summary?.personaName || player.SteamName,
        CharacterName: player.CharacterName || summary?.personaName || player.SteamName,
        Ping: player.Ping,
        Playtime: player.Playtime,
        Health: player.Health,
        IsGold: player.IsGold,
        Platform: player.Platform,
        AvatarUrl: summary?.avatarUrl || null,
        ProfileUrl: summary?.profileUrl || player.ProfileUrl,
      };
    });

    const servers = [
      {
        Id: liveServer.id,
        Name: liveServer.name,
        Players: Number(liveServer.playersOnline || playerList.length || 0),
        PendingPlayers: 0,
        MaxPlayers: Number(liveServer.maxPlayers || 0),
        Map: liveServer.map,
        Mode: liveServer.mode,
        Status: liveServer.status === 'offline' ? 'offline' : 'online',
        ThumbnailUrl: liveServer.thumbnailUrl,
        ConnectAddress: liveServer.connectAddress,
        Region: liveServer.region,
        Tags: liveServer.tags,
        SteamId: liveServer.steamId,
        LastUpdate: liveServer.lastUpdate,
        Version: liveServer.version,
        PlayerList: playerList,
      },
    ];

    return res.json(servers);
  } catch (error) {
    console.error('Servers error:', error);
    return res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const { sort = 'kills', limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), MAX_LEADERBOARD_PLAYERS);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);

    let orderBy;
    switch (sort) {
      case 'kd':
        orderBy = 'CASE WHEN PVPDeaths = 0 THEN Kills ELSE Kills / NULLIF(PVPDeaths, 0) END DESC, Kills DESC';
        break;
      case 'playtime':
        orderBy = 'Playtime DESC, Kills DESC';
        break;
      case 'kills':
      default:
        orderBy = 'Kills DESC, Headshots DESC';
        break;
    }

    let total = 0;
    let rows = [];

    try {
      const [[countRows]] = await pool.query('SELECT COUNT(*) AS total FROM PlayerStats');
      total = Math.min(Number(countRows?.total || 0), MAX_LEADERBOARD_PLAYERS);
      const offset = Math.min((parsedPage - 1) * parsedLimit, Math.max(total - 1, 0));
      const fetchLimit = Math.max(Math.min(parsedLimit, total - offset), 0);

      if (fetchLimit > 0) {
        const [rowResult] = await pool.query(`
          SELECT 
            CAST(SteamId AS CHAR) AS SteamId,
            Name,
            Kills,
            Headshots,
            PVPDeaths,
            Zombies,
            Playtime,
            CASE WHEN PVPDeaths = 0 THEN Kills ELSE ROUND(Kills / NULLIF(PVPDeaths, 0), 2) END AS KDRatio
          FROM PlayerStats
          ORDER BY ${orderBy}
          LIMIT ? OFFSET ?
        `, [fetchLimit, offset]);
        rows = rowResult || [];
      }
    } catch (dbError) {
      console.error('[Leaderboard] DB query failed:', dbError.message);
    }

    const steamIds = rows.map((row) => String(row.SteamId || '').trim()).filter((steamId) => /^\d{17}$/.test(steamId));
    const summaries = await getSteamSummaries(steamIds);
    const safePage = Math.min(parsedPage, Math.max(Math.ceil(total / parsedLimit), 1));
    const safeOffset = Math.min((safePage - 1) * parsedLimit, Math.max(total - 1, 0));

    const players = rows.map((row, index) => enrichLeaderboardRow(row, summaries.get(String(row.SteamId || '')), index, safeOffset));

    return res.json({
      players,
      pagination: {
        page: safePage,
        limit: parsedLimit,
        total,
        totalPages: Math.max(Math.ceil(total / parsedLimit), 1),
      },
      databaseConnected: rows.length > 0 || total > 0,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
