import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchSession, logoutRequest, type SessionUser } from '@/lib/api';
import { STEAM_LOGIN_URL } from '@/lib/config';

export interface SteamUser {
  steamId: string;
  displayName: string;
  avatarInitials: string;
  lastSeen: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: SteamUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithSteam: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(user: SessionUser | null): SteamUser | null {
  if (!user) {
    return null;
  }

  return {
    steamId: user.steamId,
    displayName: user.displayName,
    avatarInitials: user.avatarInitials,
    avatarUrl: user.avatarUrl,
    lastSeen: user.lastSeen,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const sessionUser = normalizeUser(await fetchSession());
      setUser(sessionUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const loginWithSteam = useCallback(async () => {
    const currentPath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/profile';
    const separator = STEAM_LOGIN_URL.includes('?') ? '&' : '?';
    const nextUrl = `${STEAM_LOGIN_URL}${separator}returnTo=${encodeURIComponent(currentPath)}`;
    window.location.assign(nextUrl);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      loginWithSteam,
      logout,
      refreshSession,
    }),
    [isLoading, loginWithSteam, logout, refreshSession, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
