import fs from 'node:fs/promises';
import https from 'node:https';
import axios from 'axios';

const REQUEST_TIMEOUT_MS = Number(process.env.PTERODACTYL_TIMEOUT_MS || 10000);
const LIVE_CACHE_TTL_MS = Number(process.env.LIVE_SERVER_CACHE_TTL_MS || 5000);

let lastKnownState = null;
let lastFetchAt = 0;

function normalizePanelConfig() {
  const rawPanel = String(process.env.PTERODACTYL_URL || process.env.PTERO_PANEL_URL || '').trim();
  const rawServerId = String(process.env.PTERODACTYL_SERVER_ID || process.env.PTERO_SERVER_ID || '').trim();
  const rawFilePath = String(process.env.PTERODACTYL_FILE_PATH || process.env.PTERO_FILE_PATH || '').trim();

  if (!rawPanel) {
    return { panelOrigin: '', serverId: rawServerId, filePath: rawFilePath };
  }

  try {
    const url = new URL(rawPanel);
    const extractedServerId = rawServerId || url.pathname.match(/\/server\/([^/]+)/)?.[1] || '';
    const extractedFilePath = rawFilePath || (url.hash.startsWith('#/') ? url.hash.slice(1) : '');
    return {
      panelOrigin: url.origin,
      serverId: extractedServerId,
      filePath: extractedFilePath,
    };
  } catch {
    return {
      panelOrigin: rawPanel.replace(/\/$/, ''),
      serverId: rawServerId,
      filePath: rawFilePath,
    };
  }
}

function parseTagsFromName(name) {
  const source = String(name || '');
  const tagGroups = [...source.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
  return tagGroups
    .flatMap((group) => group.split(/[|,]/))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.findIndex((entry) => entry.toLowerCase() === tag.toLowerCase()) === index);
}

function parseRegionFromName(name) {
  const source = String(name || '');
  if (/\bPH\b/i.test(source)) return 'PH';
  if (/\bASIA\b/i.test(source)) return 'Asia';
  if (/\bEU\b/i.test(source)) return 'EU';
  if (/\bNA\b/i.test(source)) return 'NA';
  return undefined;
}

function normalizePlayerEntry(player = {}) {
  const steamId = String(player.SteamId || player.steamId || '');
  const steamName = String(player.SteamName || player.Name || player.name || 'Unknown');
  const characterName = String(player.CharacterName || player.characterName || steamName || 'Unknown');
  const ping = Number(player.Ping ?? player.ping ?? 0);
  const playtime = Number(player.Playtime ?? player.playtime ?? 0);
  const health = Number(player.Health ?? player.health ?? 100);

  return {
    SteamId: steamId,
    SteamName: steamName,
    CharacterName: characterName,
    Ping: Number.isFinite(ping) ? ping : 0,
    Playtime: Number.isFinite(playtime) ? playtime : 0,
    Health: Number.isFinite(health) ? health : 100,
    IsGold: Boolean(player.IsGold ?? player.isGold ?? false),
    Platform: typeof player.Platform === 'string' ? player.Platform : typeof player.platform === 'string' ? player.platform : undefined,
    ProfileUrl: steamId ? `https://steamcommunity.com/profiles/${steamId}` : null,
  };
}

function buildAxiosConfig() {
  const ignoreTls = String(process.env.PTERODACTYL_IGNORE_TLS_ERRORS || 'false').toLowerCase() === 'true';
  const httpsAgent = new https.Agent({ rejectUnauthorized: !ignoreTls });

  return {
    timeout: REQUEST_TIMEOUT_MS,
    httpsAgent,
    validateStatus: () => true,
  };
}

function formatAxiosError(prefix, error) {
  const status = error?.response?.status;
  const statusText = error?.response?.statusText;
  const bodyMessage = typeof error?.response?.data === 'string' ? error.response.data.slice(0, 160) : '';
  const code = error?.code ? ` ${error.code}` : '';
  const cause = error?.cause?.message ? ` ${error.cause.message}` : '';
  const detail = status ? ` ${status}${statusText ? ` ${statusText}` : ''}` : '';
  const body = bodyMessage ? ` ${bodyMessage}` : '';
  return `[LiveServer] ${prefix}${detail}${code}${cause}${body}`.trim();
}

async function fetchLocalSnapshotFile() {
  const localFile = String(process.env.LOCAL_SNAPSHOT_FILE || '').trim();
  if (!localFile) {
    return null;
  }

  const text = await fs.readFile(localFile, 'utf8');
  return JSON.parse(text);
}

async function fetchPterodactylSnapshot() {
  const { panelOrigin, serverId, filePath } = normalizePanelConfig();
  const apiKey = String(process.env.PTERODACTYL_API_KEY || process.env.PTERO_CLIENT_API_KEY || '').trim();

  if (!panelOrigin || !apiKey || !serverId || !filePath) {
    return null;
  }

  const normalizedFilePath = filePath.replace(/^\/home\/container/, '');
  const url = `${panelOrigin}/api/client/servers/${serverId}/files/contents?file=${encodeURIComponent(normalizedFilePath)}`;
  const response = await axios.get(url, {
    ...buildAxiosConfig(),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    },
    responseType: 'text',
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Snapshot request failed ${response.status}`);
  }

  return JSON.parse(typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
}

function buildStateFromSnapshot(snapshot) {
  const rawPlayerList = Array.isArray(snapshot.PlayerList) ? snapshot.PlayerList : [];
  const players = rawPlayerList.map(normalizePlayerEntry);
  const rawPlayers = Number(snapshot.Players ?? players.length ?? 0);
  const playersOnline = rawPlayers > 0 ? rawPlayers : players.length;
  const maxPlayers = Number(snapshot.MaxPlayers ?? 0);
  const state = String(snapshot.State || snapshot.Status || '').toLowerCase();
  const name = String(snapshot.Name || 'Blood Horizon');
  const tags = parseTagsFromName(name);

  return {
    id: process.env.SERVER_ID || 'primary',
    name,
    playersOnline,
    maxPlayers: Number.isFinite(maxPlayers) && maxPlayers > 0 ? maxPlayers : 0,
    map: String(snapshot.Map || 'Unknown'),
    mode: String(snapshot.Mode || 'Unknown'),
    thumbnailUrl: String(snapshot.ThumbnailUrl || ''),
    connectAddress: process.env.SERVER_CONNECT_ADDRESS || undefined,
    region: parseRegionFromName(name),
    tags,
    status: state && state !== 'running' ? (state === 'offline' ? 'offline' : 'online') : 'online',
    steamId: snapshot.SteamId && String(snapshot.SteamId) !== '0' ? String(snapshot.SteamId) : '',
    playerList: players,
    lastUpdate: snapshot.LastUpdate || null,
    version: snapshot.Version ? String(snapshot.Version) : null,
    source: 'snapshot',
  };
}

function buildFallbackState(source = 'fallback') {
  return {
    id: process.env.SERVER_ID || 'primary',
    name: 'Blood Horizon',
    playersOnline: 0,
    maxPlayers: 0,
    map: 'Unknown',
    mode: 'Unknown',
    thumbnailUrl: '',
    connectAddress: process.env.SERVER_CONNECT_ADDRESS || undefined,
    region: undefined,
    tags: [],
    status: 'offline',
    steamId: '',
    playerList: [],
    lastUpdate: null,
    version: null,
    source,
  };
}

export async function getLiveServerState() {
  const now = Date.now();
  if (lastKnownState && now - lastFetchAt < LIVE_CACHE_TTL_MS) {
    return lastKnownState;
  }

  try {
    const localSnapshot = await fetchLocalSnapshotFile();
    if (localSnapshot) {
      lastKnownState = buildStateFromSnapshot(localSnapshot);
      lastKnownState.source = 'local-file';
      lastFetchAt = now;
      return lastKnownState;
    }
  } catch (error) {
    console.warn(`[LiveServer] Local snapshot failed: ${error.message}`);
  }

  try {
    const snapshot = await fetchPterodactylSnapshot();
    if (snapshot) {
      lastKnownState = buildStateFromSnapshot(snapshot);
      lastFetchAt = now;
      return lastKnownState;
    }
  } catch (error) {
    console.warn(formatAxiosError('Snapshot fetch failed:', error));
  }

  if (lastKnownState) {
    return {
      ...lastKnownState,
      source: `${lastKnownState.source || 'snapshot'}-cached`,
    };
  }

  return buildFallbackState();
}


export function isPlayerOnline(liveServer, steamId) {
  if (!liveServer?.playerList || !steamId) {
    return false;
  }

  const target = String(steamId).trim();
  return liveServer.playerList.some((player) => String(player?.SteamId || player?.steamId || '').trim() == target);
}
