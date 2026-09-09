import { Crown } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeaderboard, type LeaderboardPlayer } from '@/lib/api';
import { calculateKd, formatDuration, formatNumber } from '@/lib/format';
import { ErrorState } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortMode = 'kills' | 'kd' | 'playtime';
const LIMIT = 100;
const fallbackAvatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

function Leaderboards() {
  const [sort, setSort] = useState<SortMode>('kills');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchLeaderboard(sort, 1, LIMIT);
        if (ignore) return;
        setPlayers(response.players.slice(0, LIMIT));
      } catch (loadError) {
        if (ignore) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load leaderboard data.');
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void loadData();
    return () => { ignore = true; };
  }, [sort]);

  const podium = players.slice(0, 3);
  const tablePlayers = useMemo(() => players.slice(3, LIMIT), [players]);

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <section className="pb-8 pt-14">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <h1 
            className="text-3xl font-semibold tracking-tight text-white sm:text-4xl opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
          >
            Top Players
          </h1>
        </div>
      </section>

      {error && !isLoading && (
        <div className="mx-auto max-w-6xl px-5">
          <ErrorState title="Leaderboard Error" description={error} />
        </div>
      )}

      {/* Podium Section */}
      <section className="pb-14">
        <div className="mx-auto max-w-4xl px-5">
          {isLoading ? (
            <div className="flex items-end justify-center gap-4 sm:gap-6">
              <PodiumSkeleton position={2} />
              <PodiumSkeleton position={1} />
              <PodiumSkeleton position={3} />
            </div>
          ) : (
            <div 
              className="flex items-end justify-center gap-4 sm:gap-6 opacity-0 animate-scale-in"
              style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
            >
              <PodiumCard player={podium[1]} position={2} />
              <PodiumCard player={podium[0]} position={1} />
              <PodiumCard player={podium[2]} position={3} />
            </div>
          )}
        </div>
      </section>

      {/* Table Section */}
      <section className="py-4">
        <div className="mx-auto max-w-5xl px-5">
          <div 
            className="overflow-hidden rounded-2xl border border-white/[0.05] bg-[#0c0d10] opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}
          >
            {/* Sort Control */}
            <div className="flex items-center justify-end gap-3 border-b border-white/[0.05] px-5 py-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Sort by</span>
              <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
                <SelectTrigger className="h-8 w-[120px] rounded-lg border-white/[0.08] bg-white/[0.03] text-sm text-white/80 hover:bg-white/[0.05]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-white/[0.08] bg-[#0c0d10] text-white">
                  <SelectItem value="kills">Kills</SelectItem>
                  <SelectItem value="kd">K/D Ratio</SelectItem>
                  <SelectItem value="playtime">Playtime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="w-20 px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-white/30">Rank</th>
                    <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-widest text-white/30">Player</th>
                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-white/30">Kills</th>
                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-white/30">Deaths</th>
                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-white/30">K/D</th>
                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-white/30">Zombies</th>
                    <th className="px-5 py-4 text-center text-[10px] font-semibold uppercase tracking-widest text-white/30">Playtime</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => <TableSkeletonRow key={i} />)
                  ) : tablePlayers.length > 0 ? (
                    tablePlayers.map((player) => (
                      <tr 
                        key={`${player.steamId}-${player.rank}`} 
                        className="border-b border-white/[0.03] transition-colors hover:bg-white/[0.02] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-sm font-semibold text-white/60">
                            {player.rank}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link to={`/stats/${player.steamId}`} className="group flex items-center gap-3">
                            <img
                              src={player.avatarUrl || fallbackAvatar}
                              alt={player.name}
                              className="h-10 w-10 rounded-lg border border-white/[0.06] object-cover transition-all group-hover:border-yellow-400/40"
                              onError={(e) => { if (e.currentTarget.src !== fallbackAvatar) e.currentTarget.src = fallbackAvatar; }}
                            />
                            <div>
                              <p className="text-sm font-medium text-white/90 group-hover:text-yellow-200 transition-colors">{player.name}</p>
                              <p className="text-[11px] text-white/25 font-mono">{player.steamId}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-white/90">{formatNumber(player.kills)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm text-white/40">{formatNumber(player.pvpDeaths)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-white/90">{calculateKd(player.kills, player.pvpDeaths)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm text-white/40">{formatNumber(player.zombies)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm text-white/40">{formatDuration(player.playtimeSeconds)}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-20 text-center text-sm text-white/25">
                        No leaderboard data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PodiumCard({ player, position }: { player?: LeaderboardPlayer; position: 1 | 2 | 3 }) {
  const config = {
    1: {
      cardClass: '',
      avatarSize: 'h-24 w-24 sm:h-28 sm:w-28',
      ringColor: 'ring-[4px] ring-yellow-400',
      glow: 'shadow-[0_0_60px_rgba(250,204,21,0.35)]',
      badgeColor: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-950',
      podiumSolid: 'bg-yellow-400',
      podiumBorder: 'border-yellow-400/30',
      podiumGlow: 'shadow-[0_0_80px_rgba(250,204,21,0.18)]',
      podiumHeight: 'h-32',
      minWidth: 'min-w-[140px] sm:min-w-[160px]',
      crownSize: 'h-8 w-8',
      crownColor: 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]',
      nameColor: 'text-yellow-50',
      nameSize: 'text-base sm:text-lg',
      statColor: 'text-yellow-100/90',
    },
    2: {
      cardClass: '',
      avatarSize: 'h-18 w-18 sm:h-20 sm:w-20',
      ringColor: 'ring-[3px] ring-slate-300',
      glow: 'shadow-[0_0_40px_rgba(203,213,225,0.2)]',
      badgeColor: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-slate-900',
      podiumSolid: 'bg-slate-300',
      podiumBorder: 'border-slate-400/25',
      podiumGlow: 'shadow-[0_0_60px_rgba(203,213,225,0.14)]',
      podiumHeight: 'h-24',
      minWidth: 'min-w-[120px] sm:min-w-[140px]',
      crownSize: 'h-5 w-5',
      crownColor: 'text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.6)]',
      nameColor: 'text-slate-100',
      nameSize: 'text-sm sm:text-base',
      statColor: 'text-slate-200/80',
    },
    3: {
      cardClass: '',
      avatarSize: 'h-18 w-18 sm:h-20 sm:w-20',
      ringColor: 'ring-[3px] ring-amber-500',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.25)]',
      badgeColor: 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-amber-950',
      podiumSolid: 'bg-amber-500',
      podiumBorder: 'border-amber-500/30',
      podiumGlow: 'shadow-[0_0_60px_rgba(245,158,11,0.14)]',
      podiumHeight: 'h-20',
      minWidth: 'min-w-[120px] sm:min-w-[140px]',
      crownSize: 'h-5 w-5',
      crownColor: 'text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.7)]',
      nameColor: 'text-amber-100',
      nameSize: 'text-sm sm:text-base',
      statColor: 'text-amber-200/80',
    },
  }[position];

  return (
    <div className="flex flex-col items-center bg-transparent shadow-none">
      {/* Crown */}
      <div className="mb-2.5">
        <Crown className={`${config.crownSize} ${config.crownColor}`} />
      </div>

      {/* Avatar with Ring */}
      <Link 
        to={player ? `/stats/${player.steamId}` : '#'} 
        className="group relative mb-3"
      >
        <div className={`relative overflow-hidden rounded-full ${config.avatarSize} ${config.ringColor} ${config.glow} transition-transform group-hover:scale-105`}>
          {player?.avatarUrl ? (
            <img 
              src={player.avatarUrl} 
              alt={player.name} 
              className="h-full w-full object-cover"
              onError={(e) => { if (e.currentTarget.src !== fallbackAvatar) e.currentTarget.src = fallbackAvatar; }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0c0d10] text-4xl font-bold text-white/30">?</div>
          )}
        </div>
        {/* Rank Badge */}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-lg ${config.badgeColor}`}>
          {position}
        </div>
      </Link>

      {/* Player Name */}
      <Link 
        to={player ? `/stats/${player.steamId}` : '#'}
        className="text-center transition-opacity hover:opacity-80 max-w-full px-2"
      >
        <p className={`font-semibold ${config.nameColor} ${config.nameSize} truncate max-w-[140px] sm:max-w-[180px]`}>
          {player?.name ?? 'Unknown'}
        </p>
      </Link>

      {/* Stats Row */}
      <div className="mt-2.5 flex items-center gap-4 text-center">
        <div>
          <p className={`font-semibold ${config.statColor} ${position === 1 ? 'text-base' : 'text-sm'}`}>
            {formatNumber(player?.kills ?? 0)}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-white/30">Kills</p>
        </div>
        <div>
          <p className={`font-semibold ${config.statColor} ${position === 1 ? 'text-base' : 'text-sm'}`}>
            {calculateKd(player?.kills ?? 0, player?.pvpDeaths ?? 0)}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-white/30">K/D</p>
        </div>
        <div>
          <p className={`font-semibold ${config.statColor} ${position === 1 ? 'text-base' : 'text-sm'} whitespace-nowrap`}>
            {formatDuration(player?.playtimeSeconds ?? 0)}
          </p>
          <p className="text-[9px] uppercase tracking-widest text-white/30">Time</p>
        </div>
      </div>

      {/* Podium Block - Flexible width */}
      <div className={`mt-5 ${config.minWidth} w-full ${config.podiumHeight} rounded-t-[18px] ${config.podiumSolid} border-t border-x ${config.podiumBorder} ${config.podiumGlow}`} />
    </div>
  );
}

function PodiumSkeleton({ position }: { position: 1 | 2 | 3 }) {
  const height = position === 1 ? 'h-32' : position === 2 ? 'h-24' : 'h-20';
  const avatarSize = position === 1 ? 'h-28 w-28' : 'h-20 w-20';
  const minWidth = position === 1 ? 'min-w-[160px]' : 'min-w-[140px]';
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-2.5 h-8 w-8" />
      <div className={`mb-3 animate-pulse rounded-full bg-white/[0.05] ${avatarSize}`} />
      <div className="h-5 w-24 animate-pulse rounded bg-white/[0.05]" />
      <div className="mt-2.5 flex gap-4">
        <div className="h-9 w-12 animate-pulse rounded bg-white/[0.03]" />
        <div className="h-9 w-12 animate-pulse rounded bg-white/[0.03]" />
        <div className="h-9 w-12 animate-pulse rounded bg-white/[0.03]" />
      </div>
      <div className={`mt-5 ${minWidth} w-full ${height} animate-pulse rounded-t-xl bg-white/[0.03]`} />
    </div>
  );
}

function TableSkeletonRow() {
  return (
    <tr className="border-b border-white/[0.03]">
      <td className="px-5 py-4"><div className="h-8 w-8 animate-pulse rounded-lg bg-white/[0.05]" /></td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-white/[0.05]" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-3 w-36 animate-pulse rounded bg-white/[0.03]" />
          </div>
        </div>
      </td>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-5 py-4 text-center">
          <div className="mx-auto h-4 w-12 animate-pulse rounded bg-white/[0.05]" />
        </td>
      ))}
    </tr>
  );
}

export default Leaderboards;
