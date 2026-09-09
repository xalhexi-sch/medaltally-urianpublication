# Blood Horizon frontend API contract

This frontend is now wired for a minimal backend. Keep the frontend as-is and implement these endpoints behind your own server.

## Important
Do **not** call the Pterodactyl API directly from the frontend. Your Pterodactyl token must stay on the server.

## Environment variables
Use `.env` based on `.env.example`.

## Auth

### GET `/api/auth/session`
Returns the current Steam-authenticated user based on a secure cookie session.

```json
{
  "authenticated": true,
  "user": {
    "steamId": "76561198000000000",
    "displayName": "BloodLord",
    "avatarUrl": "https://...",
    "avatarInitials": "BL",
    "lastSeen": "Online now"
  }
}
```

### GET `/api/auth/steam/login`
Starts Steam OpenID login and redirects the user to Steam. Accept a `returnTo` query param and redirect back to the frontend after success.

### POST `/api/auth/logout`
Clears the session cookie.

## Public server status

### GET `/api/servers`
Can return either an array directly or `{ "servers": [...] }`.

```json
[
  {
    "Id": "primary",
    "Name": "Blood Horizon PH [5x] [TPA|KITS|HOME] A6 POLARIS",
    "Players": 1,
    "PendingPlayers": 0,
    "MaxPlayers": 100,
    "Map": "A6 Polaris",
    "Mode": "EASY",
    "ThumbnailUrl": "https://i.ibb.co/j9jjW460/Blood-Horizon-PH.png",
    "ConnectAddress": "play.bloodhorizon.ph:27015",
    "Region": "Asia",
    "Tags": ["5x", "TPA", "KITS", "HOME"],
    "Status": "online"
  }
]
```

This endpoint is the right place to consume Pterodactyl and shape the response for the frontend.

## Public overview

### GET `/api/overview`
Use your `PlayerStats` table plus live server status to fill the homepage and leaderboard summary cards.

```json
{
  "playersOnline": 1,
  "serversOnline": 1,
  "maxSlots": 100,
  "totalPlayers": 2456,
  "totalKills": 183920,
  "totalDeaths": 94731,
  "totalPlaytimeSeconds": 9842231
}
```

Suggested SQL ideas:
- `COUNT(*)` for `totalPlayers`
- `SUM(Kills)` for `totalKills`
- `SUM(PVPDeaths)` for `totalDeaths`
- `SUM(Playtime)` for `totalPlaytimeSeconds`

## Public leaderboard

### GET `/api/leaderboard?sort=kills&limit=25`
Can return either an array directly or `{ "players": [...] }`.

```json
[
  {
    "SteamId": "76561198000000000",
    "Name": "BloodLord",
    "Kills": 3247,
    "Headshots": 1182,
    "PVPDeaths": 892,
    "Zombies": 521,
    "Playtime": 1231200,
    "Rank": 1
  }
]
```

Supported sorts expected by the frontend:
- `kills`
- `kd`
- `playtime`

## Private profile

### GET `/api/profile/me`
Requires a logged-in Steam session.

```json
{
  "player": {
    "SteamId": "76561198000000000",
    "Name": "BloodLord",
    "Kills": 3247,
    "Headshots": 1182,
    "PVPDeaths": 892,
    "Zombies": 521,
    "Playtime": 1231200,
    "Rank": 1
  },
  "lastSeen": "Online now",
  "linkedAccounts": {
    "steamId": "76561198000000000",
    "discordId": null
  },
  "perServer": [
    {
      "serverId": "primary",
      "serverName": "Blood Horizon PH [5x] [TPA|KITS|HOME] A6 POLARIS",
      "map": "A6 Polaris",
      "kills": 3247,
      "headshots": 1182,
      "pvpDeaths": 892,
      "zombies": 521,
      "playtimeSeconds": 1231200
    }
  ]
}
```

For a single-server setup, `perServer` can contain just one row.
