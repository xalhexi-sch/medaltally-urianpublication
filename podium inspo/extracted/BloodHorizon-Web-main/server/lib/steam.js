const steamCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;
const XML_HEADERS = {
  'User-Agent': 'BloodHorizon/1.0 (+Steam Profile Resolver)',
  Accept: 'text/xml,application/xml,text/plain;q=0.9,*/*;q=0.8',
};

function now() {
  return Date.now();
}

function buildProfileUrl(steamId) {
  return steamId ? `https://steamcommunity.com/profiles/${steamId}` : undefined;
}

function normalizeSteamSummary(summary = {}) {
  const steamId = String(summary.steamid || '');
  return {
    steamId,
    personaName: summary.personaname || null,
    avatarUrl: summary.avatarfull || summary.avatarmedium || summary.avatar || null,
    profileUrl: summary.profileurl || buildProfileUrl(steamId),
  };
}

function fallbackSummary(steamId) {
  return {
    steamId,
    personaName: null,
    avatarUrl: null,
    profileUrl: buildProfileUrl(steamId),
  };
}

function decodeXmlValue(value) {
  return String(value || '')
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function matchXmlTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}>([\s\S]*?)</${tagName}>`, 'i');
  const match = String(xml || '').match(regex);
  return match ? decodeXmlValue(match[1]) : '';
}

async function fetchSteamCommunitySummary(steamId) {
  const profileUrl = buildProfileUrl(steamId);
  if (!profileUrl) {
    return fallbackSummary(steamId);
  }

  const response = await fetch(`${profileUrl}?xml=1`, { headers: XML_HEADERS });
  if (!response.ok) {
    throw new Error(`Steam Community ${response.status}`);
  }

  const xml = await response.text();
  return {
    steamId,
    personaName: matchXmlTag(xml, 'steamID') || null,
    avatarUrl: matchXmlTag(xml, 'avatarFull') || matchXmlTag(xml, 'avatarMedium') || matchXmlTag(xml, 'avatarIcon') || null,
    profileUrl,
  };
}

async function hydrateFromCommunity(steamIds, result, currentTime) {
  const pending = steamIds.filter((steamId) => {
    const existing = result.get(steamId);
    return !existing || !existing.personaName || !existing.avatarUrl;
  });

  for (const steamId of pending) {
    try {
      const value = await fetchSteamCommunitySummary(steamId);
      steamCache.set(steamId, { value, expiresAt: currentTime + CACHE_TTL_MS });
      result.set(steamId, value);
    } catch (error) {
      const value = result.get(steamId) || fallbackSummary(steamId);
      steamCache.set(steamId, { value, expiresAt: currentTime + CACHE_TTL_MS });
      result.set(steamId, value);
      console.warn(`[Steam] Community fallback failed for ${steamId}: ${error.message}`);
    }
  }
}

export async function getSteamSummaries(steamIds = []) {
  const key = process.env.STEAM_API_KEY || process.env.STEAM_WEB_API_KEY || '';
  const uniqueIds = [...new Set(steamIds.map((value) => String(value || '').trim()).filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map();
  }

  const result = new Map();
  const missing = [];
  const currentTime = now();

  for (const steamId of uniqueIds) {
    const cached = steamCache.get(steamId);
    if (cached && cached.expiresAt > currentTime) {
      result.set(steamId, cached.value);
    } else {
      missing.push(steamId);
    }
  }

  if (key && missing.length) {
    for (let index = 0; index < missing.length; index += 100) {
      const chunk = missing.slice(index, index + 100);
      try {
        const url = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/');
        url.searchParams.set('key', key);
        url.searchParams.set('steamids', chunk.join(','));

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Steam API ${response.status}`);
        }

        const payload = await response.json();
        const players = Array.isArray(payload?.response?.players) ? payload.response.players : [];
        const chunkMap = new Map(players.map((player) => {
          const normalized = normalizeSteamSummary(player);
          return [normalized.steamId, normalized];
        }));

        for (const steamId of chunk) {
          const value = chunkMap.get(steamId) || fallbackSummary(steamId);
          steamCache.set(steamId, { value, expiresAt: currentTime + CACHE_TTL_MS });
          result.set(steamId, value);
        }
      } catch (error) {
        console.warn('[Steam] Failed to fetch player summaries:', error.message);
        for (const steamId of chunk) {
          result.set(steamId, fallbackSummary(steamId));
        }
      }
    }
  }

  for (const steamId of missing) {
    if (!result.has(steamId)) {
      result.set(steamId, fallbackSummary(steamId));
    }
  }

  await hydrateFromCommunity(uniqueIds, result, currentTime);
  return result;
}
