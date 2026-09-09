import { ArrowRight, Bell, Play, Server, Shield, Users, Zap } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOverview, fetchServers, type OverviewResponse, type ServerStatus } from '@/lib/api';
import { formatNumber } from '@/lib/format';

function Home() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [overviewResponse, serverResponse] = await Promise.all([
          fetchOverview(),
          fetchServers(),
        ]);
        if (!active) return;
        setOverview(overviewResponse);
        setServers(serverResponse);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => { active = false; };
  }, []);

  const featuredServer = servers[0] ?? null;
  const totalPlayHours = useMemo(() => {
    if (!overview) return null;
    return Math.floor((overview.totalPlaytimeSeconds || 0) / 3600);
  }, [overview]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pb-20 pt-20 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col items-center text-center">
            {/* Live Badge */}
            <div 
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 opacity-0 animate-fade-in"
              style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-sm font-medium text-emerald-300/90">
                {overview ? `${formatNumber(overview.playersOnline)} players online now` : 'Servers are live'}
              </span>
            </div>

            {/* Headline */}
            <h1 
              className="max-w-4xl text-4xl font-semibold tracking-tight text-white opacity-0 animate-fade-in-up sm:text-5xl lg:text-6xl"
              style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
            >
              Welcome to{' '}
              <span className="text-gradient">Blood Horizon</span>
            </h1>

            {/* Subtitle */}
            <p 
              className="mt-6 max-w-2xl text-base leading-relaxed text-white/45 opacity-0 animate-fade-in-up sm:text-lg"
              style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
            >
              Unturned PvP & Survival Servers — Join thousands of players in epic battles and survival challenges.
            </p>

            {/* CTA Buttons */}
            <div 
              className="mt-10 flex flex-wrap items-center justify-center gap-4 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              <Link
                to="/servers"
                className="btn-glow-pulse group flex items-center gap-2.5 rounded-xl bg-red-600 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-red-500 hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4" fill="currentColor" />
                Play Now
              </Link>
              <a
                href="https://discord.gg/bloodhorizon"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-7 py-3.5 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:text-white hover:border-white/15"
              >
                <DiscordIcon className="h-4 w-4 text-[#5865F2]" />
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Stats - Large Numbers */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            <HeroStatCard
              label="Online Now"
              value={isLoading ? null : overview?.playersOnline ?? 0}
              accent="emerald"
              delay={0}
            />
            <HeroStatCard
              label="Servers"
              value={isLoading ? null : overview?.serversOnline ?? 0}
              accent="emerald"
              delay={1}
            />
            <HeroStatCard
              label="Total Players"
              value={isLoading ? null : overview?.totalPlayers ?? 0}
              accent="white"
              delay={2}
            />
            <HeroStatCard
              label="Hours Played"
              value={isLoading ? null : totalPlayHours ?? 0}
              accent="white"
              delay={3}
            />
          </div>
        </div>
      </section>

      {/* Features - Compact */}
      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Shield className="h-4 w-4" />}
              title="Anti-Cheat Protected"
              description="Advanced anti-cheat systems keep gameplay fair and enjoyable for everyone."
              delay={0}
            />
            <FeatureCard
              icon={<Zap className="h-4 w-4" />}
              title="24/7 Uptime"
              description="Our servers run around the clock so you can play whenever you want."
              delay={1}
            />
            <FeatureCard
              icon={<Bell className="h-4 w-4" />}
              title="Offline Raid Alerts"
              description="Link once, get Discord notifications whenever your base is under attack."
              delay={2}
            />
            <FeatureCard
              icon={<Users className="h-4 w-4" />}
              title="Active Community"
              description="Join a thriving community of players and active staff members."
              delay={3}
            />
          </div>
        </div>
      </section>

      {/* Featured Server */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Featured</p>
              <h2 className="mt-1.5 text-xl font-semibold text-white">Jump In</h2>
            </div>
            <Link 
              to="/servers" 
              className="flex items-center gap-1.5 text-sm text-white/35 transition hover:text-red-400"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="glass-card shine-border rounded-2xl p-6">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 animate-pulse rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-5 w-52 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-4 w-44 animate-pulse rounded bg-white/[0.04]" />
                </div>
              </div>
            </div>
          ) : featuredServer ? (
            <div className="glass-card shine-border group rounded-2xl p-6 transition-all hover:border-white/[0.08]">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  {featuredServer.thumbnailUrl ? (
                    <img 
                      src={featuredServer.thumbnailUrl} 
                      alt={featuredServer.name} 
                      className="h-16 w-16 rounded-xl border border-white/10 object-cover" 
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/[0.04]">
                      <Server className="h-6 w-6 text-red-400/60" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">{featuredServer.name}</h3>
                    <p className="mt-1 text-sm text-white/35">
                      {featuredServer.map} · {featuredServer.mode}
                      {featuredServer.region && ` · ${featuredServer.region}`}
                    </p>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-emerald-400/90">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {featuredServer.players}/{featuredServer.maxPlayers} online
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => featuredServer.connectAddress && window.open(`steam://connect/${featuredServer.connectAddress}`, '_blank')}
                  disabled={!featuredServer.connectAddress}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-red-500 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                  Connect
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

// Animated counter hook
function useCountUp(end: number, duration: number = 1800, startDelay: number = 0) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number | null>(null);
  
  useEffect(() => {
    const delayTimeout = setTimeout(() => {
      setHasStarted(true);
    }, startDelay);
    
    return () => clearTimeout(delayTimeout);
  }, [startDelay]);

  useEffect(() => {
    if (!hasStarted || end === 0) return;
    
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOutExpo);
      
      setCount(currentValue);
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, hasStarted]);

  return count;
}

function HeroStatCard({ 
  label, 
  value, 
  accent, 
  delay 
}: { 
  label: string; 
  value: number | null; 
  accent: 'emerald' | 'white';
  delay: number;
}) {
  const animatedValue = useCountUp(value ?? 0, 1800, 300 + delay * 200);
  
  const numberColor = accent === 'emerald' 
    ? 'text-emerald-400' 
    : 'text-white';

  return (
    <div 
      className="relative rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 text-center opacity-0 animate-fade-in-up overflow-hidden"
      style={{ animationDelay: `${0.15 + delay * 0.1}s`, animationFillMode: 'forwards' }}
    >
      {value === null ? (
        <div className="mx-auto mb-2 h-12 w-20 animate-pulse rounded-lg bg-white/[0.06]" />
      ) : (
        <p className={`stat-value text-4xl font-semibold tracking-tight tabular-nums number-glow sm:text-5xl ${numberColor}`}>
          {formatNumber(animatedValue)}
        </p>
      )}
      <p className="mt-2 text-xs font-medium uppercase tracking-widest text-white/30">{label}</p>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  delay: number;
}) {
  return (
    <div 
      className="rounded-xl border border-white/[0.04] bg-white/[0.015] p-4 opacity-0 animate-fade-in-up transition-colors hover:bg-white/[0.025] hover:border-white/[0.06]"
      style={{ animationDelay: `${0.35 + delay * 0.08}s`, animationFillMode: 'forwards' }}
    >
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400/80">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-white/35">{description}</p>
    </div>
  );
}

function DiscordIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default Home;
