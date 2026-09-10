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

export type CollegeInfo = {
  short: string
  name: string
  color: string
  textColor?: string
}

// ── Constants ──────────────────────────────────────────────

export const SOURCE_URL =
  'https://script.google.com/a/macros/urios.edu.ph/s/AKfycbwSVxdnKXFYbXG91ViCH-XxQqYnDHVmhdC7z1Euo9vScJhkWKKFdm3E4GdpCcwxg_4lxw/exec?userType=Visitor'

export const API_URL = '/api/leaderboard'
export const POLL_INTERVAL = 15_000
export const STALE_THRESHOLD = 5 * 60 * 1000 // 5 minutes

/**
 * Authentic college colors & casing directly matching the official broadcast graphic:
 * - CoN: Silver / Gray
 * - CoA: Sky Blue
 * - CEnTech: Orange
 * - CIHT: Ocean Blue
 * - CAS: Green
 * - CCJE: Red
 * - CITEC: Purple
 * - CORE: Yellow / Gold
 * - CTE: Royal Blue
 */
export const COLLEGES: Record<string, CollegeInfo> = {
  CON:     { short: 'CoN',     name: 'College of Nursing',                                         color: '#949ba4' },
  CoN:     { short: 'CoN',     name: 'College of Nursing',                                         color: '#949ba4' },
  COA:     { short: 'CoA',     name: 'College of Accountancy',                                     color: '#4ba3e3' },
  CoA:     { short: 'CoA',     name: 'College of Accountancy',                                     color: '#4ba3e3' },
  CENTECH: { short: 'CEnTech', name: 'College of Engineering & Technology',                         color: '#e66723' },
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
