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
  CON:     { short: 'CON',     name: 'College of Nursing',                                         color: '#e11d48' },
  CAS:     { short: 'CAS',     name: 'College of Arts & Sciences',                                 color: '#15803d' },
  COA:     { short: 'COA',     name: 'College of Accountancy',                                     color: '#d97706', textColor: '#fff' },
  CITEC:   { short: 'CITEC',   name: 'College of Information Technology & Engineering Computing',  color: '#0284c7' },
  CEnTech: { short: 'CEnTech', name: 'College of Engineering & Technology',                         color: '#c2410c' },
  CENTECH: { short: 'CENTECH', name: 'College of Engineering & Technology',                         color: '#c2410c' },
  CORE:    { short: 'CORE',    name: 'College of Rehabilitation Sciences',                         color: '#1d4ed8' },
  CCJE:    { short: 'CCJE',    name: 'College of Criminal Justice Education',                      color: '#ea580c' },
  CTE:     { short: 'CTE',     name: 'College of Teacher Education',                               color: '#7e22ce' },
  CIHT:    { short: 'CIHT',    name: 'College of International Hospitality & Tourism',             color: '#4f46e5' },
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
  CON:     { name: 'College of Nursing',          role: 'The Captain',     color: '#e11d48' },
  CAS:     { name: 'College of Arts & Sciences',  role: 'The Scholar',     color: '#15803d' },
  COA:     { name: 'College of Accountancy',      role: 'The Swordmaster', color: '#d97706' },
  CITEC:   { name: 'College of Info Tech & Comp', role: 'The Chef',        color: '#0284c7' },
  CEnTech: { name: 'College of Engineering',      role: 'The Navigator',   color: '#c2410c' },
  CENTECH: { name: 'College of Engineering',      role: 'The Navigator',   color: '#c2410c' },
  CORE:    { name: 'College of Rehab Sciences',   role: 'The Doctor',      color: '#1d4ed8' },
  CCJE:    { name: 'College of Criminal Justice', role: 'The Historian',   color: '#ea580c' },
  CTE:     { name: 'College of Teacher Education', role: 'The Builder',    color: '#7e22ce' },
  CIHT:    { name: 'College of Hosp & Tourism',   role: 'The Host',        color: '#4f46e5' },
}

export const DEFAULT_CREW: Crew = {
  name: 'College Department',
  role: 'Participant',
  color: '#2563eb',
}
