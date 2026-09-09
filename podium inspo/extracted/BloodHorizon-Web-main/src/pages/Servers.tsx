import { Activity, Clock, Heart, Map, Play, Shield, Terminal, Users, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState } from '@/components/ui/loading';
import { fetchServers, type ServerPlayer, type ServerStatus } from '@/lib/api';
import { formatDuration } from '@/lib/format';

const fallbackAvatar = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg';

type TabType = 'players' | 'commands' | 'info';

const commandCategories = [
  {
    name: 'Basic',
    commands: [
      { cmd: '/info', desc: 'Server info' },
      { cmd: '/stats [player]', desc: 'PVP stats' },
      { cmd: '/playtime [player]', desc: 'Session time' },
      { cmd: '/ping [player]', desc: 'Connection ping' },
    ],
  },
  {
    name: 'Chat',
    commands: [
      { cmd: '/msg [player]', desc: 'Private message' },
      { cmd: '/r', desc: 'Reply to DM' },
    ],
  },
  {
    name: 'Kits & Vaults',
    commands: [
      { cmd: '/kits', desc: 'Show all kits' },
      { cmd: '/kit <name>', desc: 'Claim a kit' },
      { cmd: '/vaults', desc: 'Open vault list' },
      { cmd: '/vault <name>', desc: 'Open a vault' },
    ],
  },
  {
    name: 'Teleport',
    commands: [
      { cmd: '/tpa [player]', desc: 'Send TPA request' },
      { cmd: '/tpa a', desc: 'Accept request' },
      { cmd: '/tpa d', desc: 'Deny request' },
      { cmd: '/home <bed>', desc: 'TP to bed' },
    ],
  },
];

const infoSections = [
  { title: 'Offline Raid Protection', icon: <Shield className="h-4 w-4" />, body: 'Protection starts once every group member is offline and generators are running.' },
  { title: 'Shield Strength', icon: <Activity className="h-4 w-4" />, body: 'Small generator gives heavy reduction. Large generator gives full immunity.' },
  { title: 'Base Decay', icon: <Heart className="h-4 w-4" />, body: 'Unpowered bases decay over time. Powered generators heal them back up.' },
  { title: 'Raid Alerts', icon: <Shield className="h-4 w-4" />, body: 'Link Discord once and the bot handles alerts from there.' },
];

function Servers() {
  const [server, setServer] = useState<ServerStatus | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('players');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const servers = await fetchServers();
        if (!mounted) return;
        setServer(servers[0] ?? null);
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to connect to server.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadData();
    return () => { mounted = false; };
  }, []);

  const playerCount = useMemo(() => server?.players || server?.playerList.length || 0, [server]);
  const isOnline = (server?.status ?? 'offline') === 'online';

  const handleConnect = () => {
    if (!server?.connectAddress) return;
    window.open(`steam://connect/${server.connectAddress}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen pb-16 pt-8">
      <div className="mx-auto max-w-6xl px-5">
        {/* Server Hero Card */}
        <section 
          className="glass-card shine-border overflow-hidden rounded-xl opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <div className="border-b border-white/[0.06] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4">
                {isLoading ? (
                  <div className="h-14 w-14 animate-pulse rounded-xl bg-white/[0.06]" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/10 text-orange-400">
                    <Play className="h-6 w-6" />
                  </div>
                )}
                <div>
                  {isLoading ? (
                    <div className="h-6 w-48 animate-pulse rounded bg-white/[0.06]" />
                  ) : (
                    <h1 className="text-xl font-semibold tracking-tight text-white">{server?.name || 'Blood Horizon'}</h1>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${isOnline ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                    {server?.map && <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">{server.map}</span>}
                    {server?.mode && <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">{server.mode}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={handleConnect}
                disabled={!server?.connectAddress}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play className="h-4 w-4" fill="currentColor" />
                Connect
              </button>
            </div>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-px bg-white/[0.04] sm:grid-cols-4">
            <MiniStat icon={<Users className="h-4 w-4" />} label="Players" value={`${playerCount}/${server?.maxPlayers ?? 0}`} isLoading={isLoading} accent />
            <MiniStat icon={<Map className="h-4 w-4" />} label="Map" value={server?.map ?? '-'} isLoading={isLoading} />
            <MiniStat icon={<Activity className="h-4 w-4" />} label="Mode" value={server?.mode ?? '-'} isLoading={isLoading} />
            <MiniStat icon={<Clock className="h-4 w-4" />} label="Version" value={server?.version ?? '-'} isLoading={isLoading} />
          </div>
        </section>

        {/* Tab Navigation */}
        <div 
          className="mt-6 flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1 opacity-0 animate-fade-in"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          <TabBtn active={activeTab === 'players'} onClick={() => setActiveTab('players')} icon={<Users className="h-4 w-4" />}>Players</TabBtn>
          <TabBtn active={activeTab === 'commands'} onClick={() => setActiveTab('commands')} icon={<Terminal className="h-4 w-4" />}>Commands</TabBtn>
          <TabBtn active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<Shield className="h-4 w-4" />}>Info</TabBtn>
        </div>

        {/* Tab Content */}
        <div 
          className="mt-6 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          {error && !server && !isLoading && <ErrorState title="Server Unavailable" description={error} />}
          {activeTab === 'players' && <PlayersTab server={server} isLoading={isLoading} />}
          {activeTab === 'commands' && <CommandsTab isLoading={isLoading} />}
          {activeTab === 'info' && <InfoTab isLoading={isLoading} />}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, isLoading, accent = false }: { icon: ReactNode; label: string; value: string; isLoading: boolean; accent?: boolean }) {
  return (
    <div className="bg-[#08090b] p-4">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${accent ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.04] text-white/50'}`}>
        {icon}
      </div>
      {isLoading ? (
        <div className="mb-1 h-5 w-12 animate-pulse rounded bg-white/[0.06]" />
      ) : (
        <p className="text-base font-semibold text-white">{value}</p>
      )}
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/30">{label}</p>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${active ? 'bg-white/[0.08] text-white' : 'text-white/50 hover:text-white/70'}`}
    >
      {icon}
      {children}
    </button>
  );
}

function PlayersTab({ server, isLoading }: { server: ServerStatus | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <div className="flex gap-3">
              <div className="h-11 w-11 animate-pulse rounded-full bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3 w-24 animate-pulse rounded bg-white/[0.04]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!server || server.playerList.length === 0) {
    return <EmptyState title="No players online" description="Players will appear here when they join." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Online Now</h2>
        <p className="text-sm text-white/40">{server.playerList.length} players</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {server.playerList.map((player) => (
          <PlayerCard key={`${player.steamId}-${player.characterName}`} player={player} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player }: { player: ServerPlayer }) {
  const pingColor = player.ping < 100 ? 'text-emerald-400' : player.ping <= 200 ? 'text-yellow-400' : 'text-red-400';
  const health = Math.min(100, Math.max(0, Number(player.health ?? 0)));
  const healthColor = health >= 67 ? 'bg-emerald-400' : health >= 34 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <Link to={`/stats/${player.steamId}`} className="glass-card shine-border group rounded-xl p-4 transition hover:border-white/[0.1]">
      <div className="flex items-start gap-3">
        <img
          src={player.avatarUrl || fallbackAvatar}
          alt={player.steamName}
          onError={(e) => { e.currentTarget.src = fallbackAvatar; }}
          className={`h-11 w-11 shrink-0 rounded-full object-cover ring-2 ${player.isGold ? 'ring-yellow-400/50' : 'ring-white/10'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white group-hover:text-orange-200">{player.characterName || player.steamName}</p>
              <p className="truncate text-xs text-white/40">{player.steamName}</p>
            </div>
            {player.isGold && (
              <span className="shrink-0 rounded-md bg-yellow-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-yellow-300">Gold</span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Wifi className="h-3 w-3" />
                Ping
              </div>
              <p className={`mt-0.5 text-sm font-semibold ${pingColor}`}>{player.ping}ms</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Clock className="h-3 w-3" />
                Session
              </div>
              <p className="mt-0.5 text-sm font-semibold text-white">{formatDuration(player.playtimeSeconds)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/50"><Heart className="h-3 w-3" />Health</span>
              <span className="font-medium text-white/60">{health}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06]">
              <div className={`h-1.5 rounded-full transition-all ${healthColor}`} style={{ width: `${health}%` }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CommandsTab({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white/[0.04]" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {commandCategories.map((cat) => (
        <div key={cat.name} className="glass-card shine-border overflow-hidden rounded-xl">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-orange-400">{cat.name}</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {cat.commands.map((c) => (
              <div key={c.cmd} className="flex items-center justify-between px-4 py-2.5">
                <code className="text-xs font-semibold text-orange-300">{c.cmd}</code>
                <span className="text-xs text-white/40">{c.desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoTab({ isLoading }: { isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-white/[0.04]" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {infoSections.map((sec) => (
        <div key={sec.title} className="glass-card shine-border rounded-xl p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
            {sec.icon}
          </div>
          <h3 className="text-sm font-semibold text-white">{sec.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/40">{sec.body}</p>
        </div>
      ))}
    </div>
  );
}

export default Servers;
