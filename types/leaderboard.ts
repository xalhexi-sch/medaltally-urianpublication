'use client'

// ── Types ──────────────────────────────────────────────────

export type MedalRow = {
  college: string
  gold: number
  silver: number
  bronze: number
  total: number
}

export type EventResult = {
  event: string
  gold?: string
  silver?: string
  bronze?: string
}

export type ApiPayload = {
  tally: unknown
  results: unknown
}

export type SortKey = 'gold' | 'silver' | 'bronze' | 'total' | 'college'

export type SortState = {
  key: SortKey
  direction: 'asc' | 'desc'
}

export type CollegeInfo = {
  short: string
  name: string
  color: string
  textColor?: string
}

export type Crew = {
  name: string
  role: string
  color: string
}

// ── Constants ──────────────────────────────────────────────

export const SOURCE_URL =
  'https://script.google.com/a/macros/urios.edu.ph/s/AKfycbwSVxdnKXFYbXG91ViCH-XxQqYnDHVmhdC7z1Euo9vScJhkWKKFdm3E4GdpCcwxg_4lxw/exec?userType=Visitor'

export const API_URL = '/api/leaderboard'
export const POLL_INTERVAL = 15_000
export const STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

/**
 * Authentic college colors directly matching the official broadcast graphic:
 * - CON: Pink
 * - CAS: Green
 * - COA: Yellow/Gold
 * - CITEC: Sky Blue
 * - CENTECH: Burnt Orange / Rust
 * - CORE: Royal Blue
 * - CCJE: Bright Orange
 * - CTE: Purple
 * - CIHT: Indigo
 */
export const COLLEGES: Record<string, CollegeInfo> = {
  CON:     { short: 'CON',     name: 'College of Nursing',                                         color: '#3960d9' },
  CAS:     { short: 'CAS',     name: 'College of Arts & Sciences',                                 color: '#277840' },
  COA:     { short: 'COA',     name: 'College of Accountancy',                                     color: '#d6991c', textColor: '#fff' },
  CITEC:   { short: 'CITEC',   name: 'College of Information Technology, Entertainment, and Computing', color: '#8ac4dc', textColor: '#0f172a' },
  CEnTech: { short: 'CEnTech', name: 'College of Engineering & Technology',                         color: '#e46e24' },
  CENTECH: { short: 'CENTECH', name: 'College of Engineering & Technology',                         color: '#e46e24' },
  CORE:    { short: 'CORE',    name: 'College of Operations, Resources, and Entrepreneurship',     color: '#7d5ca1' },
  CCJE:    { short: 'CCJE',    name: 'College of Criminal Justice Education',                      color: '#c43c08' },
  CTE:     { short: 'CTE',     name: 'College of Teacher Education',                               color: '#00057d' },
  CIHT:    { short: 'CIHT',    name: 'College of Innovative Hospitality and Tourism',              color: '#1e3a8a' },
}

export const DEFAULT_COLLEGE: CollegeInfo = {
  short: 'COLLEGE',
  name: 'College Department',
  color: '#2563eb',
  textColor: '#ffffff',
}

export function getCollegeInfo(code: string): CollegeInfo {
  const normalized = code.trim().toUpperCase()
  for (const [key, val] of Object.entries(COLLEGES)) {
    if (key.toUpperCase() === normalized) return val
  }
  return { ...DEFAULT_COLLEGE, short: code, name: code }
}

// Retained for backward compatibility
export const CREWS: Record<string, Crew> = {
  CON:     { name: 'College of Nursing',                                      role: 'The Captain',     color: '#3960d9' },
  CAS:     { name: 'College of Arts & Sciences',                              role: 'The Scholar',     color: '#277840' },
  COA:     { name: 'College of Accountancy',                                  role: 'The Swordmaster', color: '#d6991c' },
  CITEC:   { name: 'College of Info Tech, Entertainment & Computing',         role: 'The Chef',        color: '#8ac4dc' },
  CEnTech: { name: 'College of Engineering',                                  role: 'The Navigator',   color: '#e46e24' },
  CENTECH: { name: 'College of Engineering',                                  role: 'The Navigator',   color: '#e46e24' },
  CORE:    { name: 'College of Ops, Resources & Entrepreneurship',            role: 'The Doctor',      color: '#7d5ca1' },
  CCJE:    { name: 'College of Criminal Justice',                             role: 'The Historian',   color: '#c43c08' },
  CTE:     { name: 'College of Teacher Education',                            role: 'The Builder',    color: '#00057d' },
  CIHT:    { name: 'College of Innovative Hospitality & Tourism',             role: 'The Host',        color: '#1e3a8a' },
}

export const DEFAULT_CREW: Crew = {
  name: 'College Department',
  role: 'Participant',
  color: '#2563eb',
}
