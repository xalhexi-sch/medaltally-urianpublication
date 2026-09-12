'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type MedalRow,
  type EventResult,
  type ApiPayload,
  API_URL,
} from '@/types/leaderboard'
import finalData from '@/data/final-tally.json'

// ── Normalisers ────────────────────────────────────────────

function normaliseTally(input: unknown): MedalRow[] {
  if (!Array.isArray(input)) throw new Error('Invalid tally')
  return input.map((item) => {
    const row = item as Record<string, unknown>
    const college = String(row.college ?? row.code ?? '')
    const gold = Number(row.gold ?? 0)
    const silver = Number(row.silver ?? 0)
    const bronze = Number(row.bronze ?? 0)
    if (!college) throw new Error('Invalid college')
    return { college, gold, silver, bronze, total: Number(row.total ?? gold + silver + bronze) }
  })
}

function normaliseResults(input: unknown): EventResult[] {
  if (!Array.isArray(input)) return []
  return input.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    const event = String(row.event ?? '').trim()
    if (!event) return []
    return [{
      event,
      gold: String(row.gold ?? '').trim() || undefined,
      silver: String(row.silver ?? '').trim() || undefined,
      bronze: String(row.bronze ?? '').trim() || undefined,
    }]
  })
}

const initialRows = normaliseTally(finalData.tally)
const initialResults = normaliseResults(finalData.results)

// ── Relative time helper ───────────────────────────────────

export function relativeTime(date: Date | null): string {
  if (!date) return 'official final'
  return 'official final'
}

// ── Hook ───────────────────────────────────────────────────

export function useLeaderboard() {
  const [rows, setRows] = useState<MedalRow[]>(initialRows)
  const [results, setResults] = useState<EventResult[]>(initialResults)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt] = useState<Date | null>(() => new Date())
  const [stale] = useState(false)

  const mounted = useRef(true)

  // ── Reload data (for manual refresh if triggered) ─────────

  const load = useCallback(async () => {
    setSyncing(true)
    try {
      const res = await fetch(API_URL, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error('Unavailable')
      const payload = (await res.json()) as ApiPayload
      if (mounted.current) {
        setRows(normaliseTally(payload.tally))
        setResults(normaliseResults(payload.results))
        setError('')
      }
    } catch {
      // Fallback to frozen data if fetch ever fails
      if (mounted.current) {
        setRows(initialRows)
        setResults(initialResults)
      }
    } finally {
      if (mounted.current) {
        setLoading(false)
        setSyncing(false)
      }
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // ── Sorted rows (Ranked by Gold -> Silver -> Bronze) ──

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const diff = b.gold - a.gold
        return diff || b.silver - a.silver || b.bronze - a.bronze || a.college.localeCompare(b.college)
      }),
    [rows],
  )

  // ── Totals ────────────────────────────────────────────

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          gold: acc.gold + row.gold,
          silver: acc.silver + row.silver,
          bronze: acc.bronze + row.bronze,
        }),
        { gold: 0, silver: 0, bronze: 0 },
      ),
    [rows],
  )

  // ── Top three ─────────────────────────────────────────

  const topThree = useMemo(() => sorted.slice(0, 3), [sorted])

  return {
    rows,
    sorted,
    topThree,
    results,
    totals,
    loading,
    syncing,
    error,
    updatedAt,
    stale,
    reload: () => void load(),
  }
}
