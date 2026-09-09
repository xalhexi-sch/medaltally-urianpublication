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
 * - CON: Silver / Gray
 * - COA: Sky Blue
 * - CENTECH: Orange
 * - CIHT: Ocean Blue
 * - CAS: Green
 * - CCJE: Red
 * - CITEC: Purple
 * - CORE: Yellow / Gold
 * - CTE: Royal Blue
 */
export const COLLEGES: Record<string, CollegeInfo> = {
  CON:     { short: 'CON',     name: 'College of Nursing',                                         color: '#949ba4' },
  COA:     { short: 'COA',     name: 'College of Accountancy',                                     color: '#4ba3e3' },
  CENTECH: { short: 'CENTECH', name: 'College of Engineering & Technology',                         color: '#e66723' },
  CEnTech: { short: 'CEnTech', name: 'College of Engineering & Technology',                         color: '#e66723' },
  CIHT:    { short: 'CIHT',    name: 'College of Innovative Hospitality and Tourism',              color: '#1d6ecb' },
  CAS:     { short: 'CAS',     name: 'College of Arts & Sciences',                                 color: '#228b38' },
  CCJE:    { short: 'CCJE',    name: 'College of Criminal Justice Education',                      color: '#d62828' },
  CITEC:   { short: 'CITEC',   name: 'College of Information Technology, Entertainment, and Computing', color: '#7b38b8' },
  CORE:    { short: 'CORE',    name: 'College of Operations, Resources, and Entrepreneurship',     color: '#deb226', textColor: '#ffffff' },
  CTE:     { short: 'CTE',     name: 'College of Teacher Education',                               color: '#224ec7' },
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
  CON:     { name: 'College of Nursing',                                      role: 'The Doctor',        color: '#949ba4' },
  COA:     { name: 'College of Accountancy',                                  role: 'The Musician',      color: '#4ba3e3' },
  CENTECH: { name: 'College of Engineering',                                  role: 'The Shipwright',    color: '#e66723' },
  CEnTech: { name: 'College of Engineering',                                  role: 'The Shipwright',    color: '#e66723' },
  CIHT:    { name: 'College of Innovative Hospitality & Tourism',             role: 'The Helmsman',      color: '#1d6ecb' },
  CAS:     { name: 'College of Arts & Sciences',                              role: 'The Swordsman',     color: '#228b38' },
  CCJE:    { name: 'College of Criminal Justice',                             role: 'The Captain',       color: '#d62828' },
  CITEC:   { name: 'College of Info Tech, Entertainment & Computing',         role: 'The Archaeologist', color: '#7b38b8' },
  CORE:    { name: 'College of Ops, Resources & Entrepreneurship',            role: 'The Navigator',     color: '#deb226' },
  CTE:     { name: 'College of Teacher Education',                            role: 'The Cook',          color: '#224ec7' },
}

export const DEFAULT_CREW: Crew = {
  name: 'College Department',
  role: 'Participant',
  color: '#2563eb',
}
