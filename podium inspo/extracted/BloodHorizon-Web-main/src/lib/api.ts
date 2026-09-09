import { API_BASE_URL } from '@/lib/config';

export interface ServerPlayer {
  steamId: string;
  steamName: string;
  characterName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  ping: number;
  playtimeSeconds: number;
  health: number;
  isGold: boolean;
  platform?: string;
}

export interface ServerStatus {
  id: string;
  name: string;
  players: number;
  pendingPlayers: number;
  maxPlayers: number;
  map: string;
  mode: string;
  thumbnailUrl?: string;
  connectAddress?: string;
  region?: string;
  description?: string;
  tags?: string[];
  status: 'online' | 'offline';
  playerList: ServerPlayer[];
  lastUpdate?: string | null;
  version?: string | null;
  steamId?: string;
}

export interface OverviewResponse {
  playersOnline: number;
  serversOnline: number;
  maxSlots: number;
  totalPlayers: number;
  totalKills: number;
  totalDeaths: number;
  totalPlaytimeSeconds: number;
}

export interface LeaderboardPlayer {
  steamId: string;
  name: string;
  kills: number;
  headshots: number;
  pvpDeaths: number;
  zombies: number;
  megaZombies: number;
  animals: number;
  resources: number;
  harvests: number;
  fish: number;
  structures: number;
  barricades: number;
  playtimeSeconds: number;
  rank?: number;
  avatarUrl?: string;
  profileUrl?: string;
  lastUpdated?: string | null;
}

export interface LeaderboardPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeaderboardResponse {
  players: LeaderboardPlayer[];
  pagination: LeaderboardPagination;
}

export type LeaderboardSortMode = 'kills' | 'kd' | 'playtime';

export interface ProfileBreakdown {
  serverId: string;
  serverName: string;
  map?: string;
  kills: number;
  headshots: number;
  pvpDeaths: number;
  zombies: number;
  playtimeSeconds: number;
}

export interface PlayerProfileResponse {
  player: LeaderboardPlayer;
  lastSeen?: string;
  linkedAccounts?: {
    steamId: string;
    discordId?: string | null;
  };
  perServer?: ProfileBreakdown[];
}

export interface SessionUser {
  steamId: string;
  displayName: string;
  avatarInitials: string;
  lastSeen: string;
  avatarUrl?: string;
}

export interface DiscordLinkStatus {
  linked: boolean;
  status?: string;
  message?: string;
  discordId?: string | null;
}

interface SessionResponse {
  authenticated: boolean;
  user?: {
    steamId: string;
    displayName?: string;
    name?: string;
    avatarUrl?: string;
    avatarInitials?: string;
    lastSeen?: string;
  };
}

function withBase(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withBase(path), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const preview = (await response.text().catch(() => '')).slice(0, 140).replace(/\s+/g, ' ').trim();
    throw new Error(preview ? `Expected JSON response from API. ${preview}` : 'Expected JSON response from API. Check VITE_API_BASE_URL.');
  }

  const payload = await response.json() as T | { error?: string; message?: string };

  if (!response.ok) {
    const errorMessage = typeof (payload as { error?: string }).error === 'string'
      ? (payload as { error?: string }).error
      : typeof (payload as { message?: string }).message === 'string'
        ? (payload as { message?: string }).message
        : `Request failed: ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload as T;
}

function normalizeServerPlayer(input: Record<string, unknown>): ServerPlayer {
  const steamId = String(input.SteamId ?? input.steamId ?? '');
  const profileUrl = typeof input.ProfileUrl === 'string'
    ? input.ProfileUrl
    : typeof input.profileUrl === 'string'
      ? input.profileUrl
      : steamId
        ? `https://steamcommunity.com/profiles/${steamId}`
        : null;

  return {
    steamId,
    steamName: String(input.SteamName ?? input.Name ?? input.name ?? 'Unknown'),
    characterName: String(input.CharacterName ?? input.characterName ?? input.SteamName ?? input.Name ?? 'Unknown'),
    avatarUrl:
      typeof input.AvatarUrl === 'string'
        ? input.AvatarUrl
        : typeof input.avatarUrl === 'string'
          ? input.avatarUrl
          : null,
    profileUrl,
    ping: Number(input.Ping ?? input.ping ?? 0),
    playtimeSeconds: Number(input.Playtime ?? input.playtimeSeconds ?? 0),
    health: Number(input.Health ?? input.health ?? 100),
    isGold: Boolean(input.IsGold ?? input.isGold ?? false),
    platform: typeof input.Platform === 'string'
      ? input.Platform
      : typeof input.platform === 'string'
        ? input.platform
        : undefined,
  };
}

function extractTags(input: Record<string, unknown>): string[] {
  if (Array.isArray(input.Tags)) {
    return input.Tags.map(String).filter(Boolean);
  }

  if (typeof input.Tags === 'string') {
    return input.Tags.split(/[|,]/).map((value) => value.trim()).filter(Boolean);
  }

  if (typeof input.Name === 'string') {
    const matches = [...input.Name.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
    return matches.flatMap((chunk) => chunk.split(/[|,]/).map((value) => value.trim()).filter(Boolean));
  }

  return [];
}

function normalizeServer(input: Record<string, unknown>, index: number): ServerStatus {
  const rawPlayerList = Array.isArray(input.PlayerList) ? input.PlayerList : [];

  const playerList: ServerPlayer[] = rawPlayerList
    .filter((value): value is Record<string, unknown> => typeof value === 'object' && value !== null)
    .map((player) => normalizeServerPlayer(player));

  const players = Number(input.Players ?? input.players ?? playerList.length ?? 0);
  const maxPlayers = Number(input.MaxPlayers ?? input.maxPlayers ?? 0);
  const connectAddress = typeof input.ConnectAddress === 'string'
    ? input.ConnectAddress
    : typeof input.connectAddress === 'string'
      ? input.connectAddress
      : typeof input.IP === 'string'
        ? input.IP
        : typeof input.Ip === 'string'
          ? input.Ip
          : undefined;

  const mode = typeof input.Mode === 'string' ? input.Mode : 'Unknown';
  const tags = extractTags(input);
  const rawStatus = String(input.Status ?? input.status ?? '').toLowerCase();
  const normalizedStatus: ServerStatus['status'] = ['offline', 'stopped'].includes(rawStatus) ? 'offline' : 'online';

  return {
    id: String(input.Id ?? input.ServerId ?? input.serverId ?? input.SteamId ?? `server-${index + 1}`),
    name: String(input.Name ?? input.name ?? `Blood Horizon #${index + 1}`),
    players,
    pendingPlayers: Number(input.PendingPlayers ?? input.pendingPlayers ?? 0),
    maxPlayers,
    map: String(input.Map ?? input.map ?? 'Unknown map'),
    mode,
    thumbnailUrl:
      typeof input.ThumbnailUrl === 'string'
        ? input.ThumbnailUrl
        : typeof input.thumbnailUrl === 'string'
          ? input.thumbnailUrl
          : undefined,
    connectAddress,
    region:
      typeof input.Region === 'string'
        ? input.Region
        : typeof input.region === 'string'
          ? input.region
          : undefined,
    description: typeof input.Description === 'string'
      ? input.Description
      : `${mode} shard with ${players}/${maxPlayers} players online.`,
    tags,
    status: normalizedStatus,
    playerList,
    lastUpdate: typeof input.LastUpdate === 'string' ? input.LastUpdate : typeof input.lastUpdate === 'string' ? input.lastUpdate : null,
    version: typeof input.Version === 'string' ? input.Version : typeof input.version === 'string' ? input.version : null,
    steamId: typeof input.SteamId === 'string' ? input.SteamId : typeof input.steamId === 'string' ? input.steamId : undefined,
  };
}

function normalizePlayer(input: Record<string, unknown>, index: number): LeaderboardPlayer {
  const steamId = String(input.steamId ?? input.SteamId ?? `unknown-${index}`);

  return {
    steamId,
    name: String(input.name ?? input.Name ?? 'Unknown Player'),
    kills: Number(input.kills ?? input.Kills ?? 0),
    headshots: Number(input.headshots ?? input.Headshots ?? 0),
    pvpDeaths: Number(input.pvpDeaths ?? input.PVPDeaths ?? input.Deaths ?? 0),
    zombies: Number(input.zombies ?? input.Zombies ?? 0),
    megaZombies: Number(input.megaZombies ?? input.MegaZombies ?? 0),
    animals: Number(input.animals ?? input.Animals ?? 0),
    resources: Number(input.resources ?? input.Resources ?? 0),
    harvests: Number(input.harvests ?? input.Harvests ?? 0),
    fish: Number(input.fish ?? input.Fish ?? 0),
    structures: Number(input.structures ?? input.Structures ?? 0),
    barricades: Number(input.barricades ?? input.Barricades ?? 0),
    playtimeSeconds: Number(input.playtimeSeconds ?? input.Playtime ?? 0),
    rank: input.rank != null ? Number(input.rank) : input.Rank != null ? Number(input.Rank) : index + 1,
    avatarUrl: typeof input.avatarUrl === 'string' ? input.avatarUrl : typeof input.AvatarUrl === 'string' ? input.AvatarUrl : undefined,
    profileUrl: typeof input.profileUrl === 'string'
      ? input.profileUrl
      : typeof input.ProfileUrl === 'string'
        ? input.ProfileUrl
        : steamId
          ? `https://steamcommunity.com/profiles/${steamId}`
          : undefined,
    lastUpdated: typeof input.lastUpdated === 'string' ? input.lastUpdated : typeof input.LastUpdated === 'string' ? input.LastUpdated : null,
  };
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return fetchJson<OverviewResponse>('/overview');
}

export async function fetchLeaderboard(sort: LeaderboardSortMode = 'kills', page = 1, limit = 100): Promise<LeaderboardResponse> {
  const response = await fetchJson<{ players?: Record<string, unknown>[]; pagination?: LeaderboardPagination }>(`/leaderboard?sort=${sort}&page=${page}&limit=${limit}`);

  const players = Array.isArray(response.players)
    ? response.players.map((player, index) => normalizePlayer(player, (page - 1) * limit + index))
    : [];

  return {
    players,
    pagination: response.pagination ?? {
      page,
      limit,
      total: players.length,
      totalPages: 1,
    },
  };
}

export async function fetchPlayerProfile(steamId: string): Promise<PlayerProfileResponse> {
  const response = await fetchJson<{
    player?: Record<string, unknown>;
    lastSeen?: string;
    linkedAccounts?: { steamId: string; discordId?: string | null };
    perServer?: ProfileBreakdown[];
  }>(`/profile/${steamId}`);

  return {
    player: normalizePlayer(response.player ?? { steamId }, 0),
    lastSeen: response.lastSeen,
    linkedAccounts: response.linkedAccounts,
    perServer: response.perServer,
  };
}

export async function fetchServers(): Promise<ServerStatus[]> {
  const response = await fetchJson<unknown>('/servers');
  const serverArray = Array.isArray(response)
    ? response
    : Array.isArray((response as { servers?: unknown[] }).servers)
      ? (response as { servers?: unknown[] }).servers ?? []
      : [response];

  return serverArray
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((server, index) => normalizeServer(server, index));
}

export async function fetchProfile(): Promise<PlayerProfileResponse> {
  const response = await fetchJson<{
    player?: Record<string, unknown>;
    lastSeen?: string;
    linkedAccounts?: { steamId: string; discordId?: string | null };
    perServer?: ProfileBreakdown[];
  }>('/profile/me');

  return {
    player: normalizePlayer(response.player ?? {}, 0),
    lastSeen: response.lastSeen,
    linkedAccounts: response.linkedAccounts,
    perServer: response.perServer,
  };
}

export async function logoutRequest(): Promise<void> {
  await fetchJson('/auth/logout', { method: 'POST' });
}

export function getDiscordLinkStartUrl(): string {
  return withBase('/link/discord/start');
}

export async function fetchDiscordLinkStatus(): Promise<DiscordLinkStatus> {
  const response = await fetchJson<Record<string, unknown>>('/link/status');
  return {
    linked: Boolean(response.linked),
    status: typeof response.status === 'string' ? response.status : undefined,
    message: typeof response.message === 'string' ? response.message : undefined,
    discordId:
      typeof response.discordId === 'string'
        ? response.discordId
        : typeof response.DiscordId === 'string'
          ? response.DiscordId
          : null,
  };
}

export async function unlinkDiscordLink(): Promise<{ success: boolean; message?: string }> {
  return fetchJson<{ success: boolean; message?: string }>('/link/unlink', { method: 'POST' });
}

export async function fetchSession(): Promise<SessionUser | null> {
  const response = await fetchJson<SessionResponse>('/auth/session');
  if (!response.authenticated || !response.user) {
    return null;
  }

  const displayName = response.user.displayName ?? response.user.name ?? 'Blood Horizon Player';
  return {
    steamId: response.user.steamId,
    displayName,
    avatarInitials: response.user.avatarInitials ?? displayName.slice(0, 2).toUpperCase(),
    lastSeen: response.user.lastSeen ?? 'Recently seen',
    avatarUrl: response.user.avatarUrl,
  };
}
