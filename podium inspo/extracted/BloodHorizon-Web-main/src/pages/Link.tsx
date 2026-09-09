import { Bell, Check, Link2Off, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDiscordLinkStatus, getDiscordLinkStartUrl, unlinkDiscordLink, type DiscordLinkStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui/loading';
import SteamIcon from '@/components/SteamIcon';

const STATUS_COPY: Record<string, string> = {
  linked: 'Discord linked successfully.',
  link_failed: 'Discord login worked, but the bot rejected the link.',
  token_failed: 'Discord login failed. Try again.',
  user_failed: 'Discord account lookup failed.',
  invalid_state: 'Session expired. Start again.',
  error: 'Something went wrong. Try again.',
};

function LinkPage() {
  const { isAuthenticated, isLoading, loginWithSteam, user } = useAuth();
  const [status, setStatus] = useState<DiscordLinkStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStatus() {
    if (!isAuthenticated) {
      setStatus(null);
      return;
    }
    setStatusLoading(true);
    try {
      setStatus(await fetchDiscordLinkStatus());
    } catch (error) {
      setStatus({ linked: false, status: 'error', message: error instanceof Error ? error.message : 'Unable to check status.' });
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    const discordStatus = new URLSearchParams(window.location.search).get('discord');
    if (!discordStatus) return;
    setMessage(STATUS_COPY[discordStatus] ?? 'Status updated.');
    void loadStatus();
    const url = new URL(window.location.href);
    url.searchParams.delete('discord');
    window.history.replaceState({}, '', `${url.pathname}${url.search}`);
  }, []);

  const handleSteam = async () => {
    await loginWithSteam();
  };

  const handleDiscord = () => {
    window.location.assign(getDiscordLinkStartUrl());
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const response = await unlinkDiscordLink();
      setMessage(response.message ?? 'Discord unlinked.');
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to unlink.');
    } finally {
      setUnlinking(false);
    }
  };

  const discordLinked = Boolean(status?.linked);
  const allSet = isAuthenticated && discordLinked;

  return (
    <div className="min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-md px-5">
        {/* Header */}
        <div 
          className="mb-10 text-center opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Link Your Accounts
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/50">
            Connect your Steam and Discord accounts to receive raid alerts and notifications when your base is under attack.
          </p>
        </div>

        {/* Steps */}
        <div 
          className="space-y-4 opacity-0 animate-fade-in-up"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
        >
          {/* Step 1: Steam */}
          <div className="flex items-start gap-4">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
              isAuthenticated ? 'bg-emerald-500' : 'border-2 border-white/20'
            }`}>
              {isAuthenticated && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white">Sign in with Steam</h3>
              {isAuthenticated ? (
                <p className="mt-1 text-sm text-emerald-400">Signed in as {user?.displayName ?? 'Player'}</p>
              ) : (
                <button
                  onClick={() => void handleSteam()}
                  disabled={isLoading}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-[#171a21] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1b2838] disabled:opacity-50"
                >
                  {isLoading ? <Spinner size="sm" className="text-white/70" /> : <SteamIcon className="h-4 w-4" />}
                  {isLoading ? 'Connecting...' : 'Sign in with Steam'}
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Discord */}
          <div className="flex items-start gap-4">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
              discordLinked ? 'bg-emerald-500' : 'border-2 border-white/20'
            }`}>
              {discordLinked && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white">Link Discord</h3>
              {discordLinked ? (
                <div>
                  <p className="mt-1 text-sm text-emerald-400">
                    Discord linked {status?.discordId && <span className="text-emerald-400/70">{status.discordId}</span>}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleDiscord}
                      className="rounded-lg bg-[#5865F2] px-3 py-2 text-xs font-medium text-white transition-all hover:bg-[#4752C4]"
                    >
                      Relink
                    </button>
                    <button
                      onClick={() => void handleUnlink()}
                      disabled={unlinking}
                      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/60 transition-all hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      {unlinking ? <Spinner size="sm" className="text-white/60" /> : <Link2Off className="h-3 w-3" />}
                      Unlink
                    </button>
                  </div>
                </div>
              ) : isAuthenticated ? (
                <div>
                  <p className="mt-1 text-sm text-white/40">Connect your Discord account</p>
                  <button
                    onClick={handleDiscord}
                    className="mt-3 flex items-center gap-2 rounded-lg bg-[#5865F2] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#4752C4]"
                  >
                    <DiscordIcon className="h-4 w-4" />
                    Link Discord
                  </button>
                </div>
              ) : (
                <p className="mt-1 text-sm text-white/30">Complete step 1 first</p>
              )}
            </div>
          </div>

          {/* Step 3: All Set */}
          <div className="flex items-start gap-4">
            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5 ${
              allSet ? 'bg-emerald-500' : 'border-2 border-white/20'
            }`}>
              {allSet && <Check className="h-3.5 w-3.5 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-medium text-white">All Set</h3>
              {allSet ? (
                <p className="mt-1 text-sm text-emerald-400">
                  {"You'll receive raid alerts via Discord DMs when your structures are under attack."}
                </p>
              ) : (
                <p className="mt-1 text-sm text-white/30">Complete both steps to activate alerts</p>
              )}
            </div>
          </div>
        </div>

        {/* Rewards - Only show when all set */}
        {allSet && (
          <div 
            className="mt-10 grid grid-cols-2 gap-3 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
          >
            <div className="glass-card shine-border flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Package className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Extra Vault</p>
                <p className="text-xs text-white/40">Unlocked</p>
              </div>
            </div>
            <div className="glass-card shine-border flex items-center gap-3 rounded-xl p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
                <Bell className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Raid Alerts</p>
                <p className="text-xs text-white/40">Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {(message || statusLoading) && (
          <div 
            className="mt-6 rounded-lg bg-white/[0.03] px-4 py-3 text-sm text-white/50 opacity-0 animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
          >
            {statusLoading ? 'Checking status...' : message}
          </div>
        )}

        {/* Quick Link to Profile */}
        {allSet && (
          <div 
            className="mt-8 text-center opacity-0 animate-fade-in"
            style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
          >
            <Link 
              to="/profile" 
              className="text-sm text-white/40 transition-colors hover:text-white/70"
            >
              View your profile →
            </Link>
          </div>
        )}
      </div>
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

export default LinkPage;
