import { Bell, Check, Copy, ExternalLink, LogOut } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  fetchDiscordLinkStatus,
  fetchPlayerProfile,
  fetchProfile,
  type DiscordLinkStatus,
  type PlayerProfileResponse,
} from '@/lib/api';
import { calculateKd, formatDuration, formatNumber } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import { ErrorState, PageLoader, Spinner } from '@/components/ui/loading';

const fallbackAvatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';

const DISCORD_STATUS_COPY: Record<string, string> = {
  linked: 'Raid alerts active.',
  link_failed: 'Discord link failed.',
  token_failed: 'Discord connection failed.',
  user_failed: 'Discord lookup failed.',
  invalid_state: 'Session expired.',
  error: 'Something went wrong.',
};

function Profile() {
  const { steamId } = useParams();
  const isPublicProfile = Boolean(steamId);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<PlayerProfileResponse | null>(null);
  const [linkStatus, setLinkStatus] = useState<DiscordLinkStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkStatusLoading, setIsLinkStatusLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  async function loadProfile() {
    setIsLoading(true);
    setError(null);
    try {
      const response = steamId ? await fetchPlayerProfile(steamId) : await fetchProfile();
      setProfile(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load this profile.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLinkStatus() {
    if (isPublicProfile || !isAuthenticated) {
      setIsLinkStatusLoading(false);
      return;
    }
    setIsLinkStatusLoading(true);
    try {
      setLinkStatus(await fetchDiscordLinkStatus());
    } catch {
      setLinkStatus({ linked: false, status: 'error', message: 'Unable to check status.' });
    } finally {
      setIsLinkStatusLoading(false);
    }
  }

  useEffect(() => {
    if (!isPublicProfile && !isAuthenticated) {
      navigate('/link');
      return;
    }
    void loadProfile();
    void loadLinkStatus();
  }, [isAuthenticated, isPublicProfile, navigate, steamId]);

  useEffect(() => {
    if (isPublicProfile) return;
    const discordStatus = new URLSearchParams(location.search).get('discord');
    if (!discordStatus) return;
    setLinkMessage(DISCORD_STATUS_COPY[discordStatus] ?? 'Status updated.');
    void loadLinkStatus();
    const params = new URLSearchParams(location.search);
    params.delete('discord');
    navigate({ pathname: location.pathname, search: params.toString() ? `?${params.toString()}` : '' }, { replace: true });
  }, [isPublicProfile, location.pathname, location.search, navigate]);

  const player = profile?.player;

  const stats = useMemo(() => {
    if (!player) return [];
    const headshotPct = Math.round(((player.headshots ?? 0) / Math.max(player.kills ?? 1, 1)) * 100);
    return [
      { label: 'Kills', value: formatNumber(player.kills ?? 0) },
      { label: 'K/D', value: calculateKd(player.kills ?? 0, player.pvpDeaths ?? 0) },
      { label: 'Headshot %', value: `${headshotPct}%` },
      { label: 'Playtime', value: formatDuration(player.playtimeSeconds ?? 0) },
      { label: 'Deaths', value: formatNumber(player.pvpDeaths ?? 0) },
      { label: 'Zombies', value: formatNumber(player.zombies ?? 0) },
      { label: 'Mega', value: formatNumber(player.megaZombies ?? 0) },
      { label: 'Animals', value: formatNumber(player.animals ?? 0) },
      { label: 'Resources', value: formatNumber(player.resources ?? 0) },
      { label: 'Harvests', value: formatNumber(player.harvests ?? 0) },
      { label: 'Fish', value: formatNumber(player.fish ?? 0) },
      { label: 'Builds', value: formatNumber((player.structures ?? 0) + (player.barricades ?? 0)) },
    ];
  }, [player]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <PageLoader message="Loading profile..." />;
  }

  if (error || !player) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-6xl px-5">
          <ErrorState title="Profile Error" description={error || 'Player not found.'} onRetry={() => void loadProfile()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 pt-8">
      <div className="mx-auto max-w-6xl px-5">
        {/* Header */}
        <header 
          className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <div className="flex items-start gap-4">
            <img
              src={player.avatarUrl || user?.avatarUrl || fallbackAvatar}
              alt={player.name}
              onError={(event) => { event.currentTarget.src = fallbackAvatar; }}
              className="h-16 w-16 rounded-xl border border-white/10 object-cover"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{player.name}</h1>
                {player.rank && (
                  <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                    #{player.rank}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-white/40">
                <span className="font-mono text-xs">{player.steamId}</span>
                <button 
                  onClick={() => void handleCopy(player.steamId)} 
                  className="rounded p-1 text-white/30 transition hover:bg-white/[0.05] hover:text-white/60"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-white/30">Last seen {profile?.lastSeen ?? 'Unknown'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={player.profileUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
            >
              Steam
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {!isPublicProfile && (
              <button 
                onClick={() => void handleLogout()} 
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white/70"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {/* Raid Alerts Banner (Own Profile Only) */}
        {!isPublicProfile && (
          <div 
            className="mb-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}
          >
            {isLinkStatusLoading ? (
              <div className="glass-card shine-border flex items-center gap-3 rounded-xl px-5 py-4">
                <Spinner size="sm" className="text-white/40" />
                <span className="text-sm text-white/40">Checking raid alerts...</span>
              </div>
            ) : linkStatus?.linked ? (
              <div className="glass-card shine-border flex items-center justify-between rounded-xl px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Bell className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Raid Alerts Active</p>
                    <p className="text-xs text-white/40">{"You'll be notified via Discord when attacked"}</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Linked
                </span>
              </div>
            ) : (
              <Link 
                to="/link"
                className="glass-card shine-border flex items-center justify-between rounded-xl px-5 py-4 transition-all hover:bg-white/[0.04]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                    <Bell className="h-4 w-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Enable Raid Alerts</p>
                    <p className="text-xs text-white/40">Link Discord to get notified when attacked</p>
                  </div>
                </div>
                <span className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                  Set up →
                </span>
              </Link>
            )}
            {linkMessage && (
              <p className="mt-2 text-xs text-white/40">{linkMessage}</p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <section>
          <h2 
            className="mb-4 text-xs font-medium uppercase tracking-wider text-white/30 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          >
            Player Statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {stats.map((stat, index) => (
              <div 
                key={stat.label}
                className="glass-card shine-border rounded-xl p-4 opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${0.2 + index * 0.03}s`, animationFillMode: 'forwards' }}
              >
                <p className="text-xl font-semibold tracking-tight text-white">{stat.value}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/35">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
