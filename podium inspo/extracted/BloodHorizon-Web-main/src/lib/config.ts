const normalize = (value?: string) => value?.replace(/\/$/, '') ?? '';

export const API_BASE_URL = normalize(import.meta.env.VITE_API_BASE_URL) || '/api';
export const STEAM_LOGIN_URL = import.meta.env.VITE_STEAM_LOGIN_URL || `${API_BASE_URL}/auth/steam/login`;
export const SITE_NAME = import.meta.env.VITE_SITE_NAME || 'Blood Horizon';
