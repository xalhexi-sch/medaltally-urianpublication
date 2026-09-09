import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import SteamIcon from './SteamIcon';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, loginWithSteam, user } = useAuth();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/servers', label: 'Servers' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/link', label: 'Link' },
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-[#08090b] text-white">
      {/* Animated Background */}
      <div className="bg-animated">
        <div className="orb orb-1 animate-orb-1" />
        <div className="orb orb-2 animate-orb-2" />
        <div className="orb orb-3 animate-orb-3" />
      </div>
      <div className="bg-grid" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#08090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <img
              src="https://img.unbeaten.gg/Blood-Horizon-PH.png"
              alt="Blood Horizon"
              className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10"
            />
            <span className="text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl">
              Blood <span className="text-gradient">Horizon</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  currentPath === item.path 
                    ? 'text-red-500' 
                    : 'text-red-500/60 hover:text-red-500'
                }`}
              >
                {item.label}
                {currentPath === item.path && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-red-500" />
                )}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/profile"
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  currentPath === '/profile' 
                    ? 'text-red-500' 
                    : 'text-red-500/60 hover:text-red-500'
                }`}
              >
                Profile
                {currentPath === '/profile' && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-red-500" />
                )}
              </Link>
            )}
          </nav>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <Link 
                to="/profile" 
                className="group flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-4 transition-all hover:border-red-500/30 hover:bg-white/[0.05]"
              >
                <img 
                  src={user.avatarUrl ?? 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg'} 
                  alt={user.displayName} 
                  className="h-7 w-7 rounded-full ring-1 ring-white/10" 
                />
                <span className="text-sm font-medium text-white/90">{user.displayName}</span>
              </Link>
            ) : (
              <button 
                onClick={() => void loginWithSteam()} 
                disabled={isLoading} 
                className="btn-steam flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <SteamIcon className="h-4 w-4" />
                {isLoading ? 'Connecting...' : 'Sign in'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#08090b]/95 py-10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-lg font-semibold tracking-[-0.02em] text-white/90">
                Blood <span className="text-gradient">Horizon</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/40">
                Unturned PvP & Survival Servers. Track your stats, link your Discord, and get raid alerts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-white/40">
              <Link to="/servers" className="transition hover:text-red-500/80">Servers</Link>
              <Link to="/leaderboard" className="transition hover:text-red-500/80">Leaderboard</Link>
              <Link to="/link" className="transition hover:text-red-500/80">Link</Link>
              <a 
                href="https://discord.gg/bloodhorizon" 
                target="_blank" 
                rel="noreferrer" 
                className="transition hover:text-red-500/80"
              >
                Discord
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-white/[0.04] pt-6 text-xs text-white/25">
            {new Date().getFullYear()} Blood Horizon
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
