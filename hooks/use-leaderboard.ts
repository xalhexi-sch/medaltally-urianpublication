'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type MedalRow,
  type EventResult,
  type ApiPayload,
  type SortKey,
  type SortState,
  API_URL,
  POLL_INTERVAL,
  STALE_THRESHOLD,
  CREWS,
  DEFAULT_CREW,
} from '@/types/leaderboard'

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

// ── Data fetcher ───────────────────────────────────────────

async function fetchScores(signal: AbortSignal) {
  const response = await fetch(API_URL, {
    signal,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error('The scoreboard is temporarily unavailable.')
  const payload = (await response.json()) as ApiPayload
  return { rows: normaliseTally(payload.tally), results: normaliseResults(payload.results) }
}

// ── Relative time helper ───────────────────────────────────

export function relativeTime(date: Date | null): string {
  if (!date) return 'waiting for first sync'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

// ── Hook ───────────────────────────────────────────────────

export function useLeaderboard() {
  const [rows, setRows] = useState<MedalRow[]>([])
  const [results, setResults] = useState<EventResult[]>([])
  const [sort, setSort] = useState<SortState>({ key: 'gold', direction: 'desc' })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [stale, setStale] = useState(false)

  const hashRef = useRef('')
  const mounted = useRef(true)
  const requestActive = useRef(false)

  // ── Load data ─────────────────────────────────────────

  const load = useCallback(async (initial = false) => {
    if (requestActive.current) return
    requestActive.current = true
    if (!initial) setSyncing(true)

    try {
      let next: Awaited<ReturnType<typeof fetchScores>> | null = null

      for (let attempt = 0; attempt < (initial ? 3 : 1); attempt += 1) {
        try {
          const controller = new AbortController()
          const timeout = window.setTimeout(() => controller.abort(), 10_000)
          next = await fetchScores(controller.signal)
          window.clearTimeout(timeout)
          break
        } catch {
          if (attempt === (initial ? 2 : 0))
            throw new Error('The scoreboard is temporarily unavailable.')
        }
      }

      if (!mounted.current || !next) return

      const nextHash = JSON.stringify(next)
      if (nextHash !== hashRef.current) {
        hashRef.current = nextHash
        setRows(next.rows)
        setResults(next.results)
        setUpdatedAt(new Date())
        setStale(false)
      }
      setError('')
    } catch {
      if (mounted.current)
        setError('The scoreboard is temporarily unavailable. Please try again.')
    } finally {
      requestActive.current = false
      if (mounted.current) {
        setLoading(false)
        setSyncing(false)
      }
    }
  }, [])

  // ── Polling + stale detection ─────────────────────────

  useEffect(() => {
    mounted.current = true
    void load(true)
    const interval = window.setInterval(() => void load(false), POLL_INTERVAL)

    const staleCheck = window.setInterval(() => {
      if (updatedAt && Date.now() - updatedAt.getTime() > STALE_THRESHOLD) {
        setStale(true)
      }
    }, 30_000)

    return () => {
      mounted.current = false
      window.clearInterval(interval)
      window.clearInterval(staleCheck)
    }
  }, [load, updatedAt])

  // ── Sorted rows ───────────────────────────────────────

  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (sort.key === 'college')
          return sort.direction === 'asc'
            ? a.college.localeCompare(b.college)
            : b.college.localeCompare(a.college)
        const diff = b[sort.key] - a[sort.key]
        return diff || b.gold - a.gold || b.silver - a.silver || a.college.localeCompare(b.college)
      }),
    [rows, sort],
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

  // ── Top three (always sorted by gold-first) ──────────

  const topThree = useMemo(() => {
    const goldSorted = [...rows].sort((a, b) => {
      const diff = b.gold - a.gold
      return diff || b.silver - a.silver || b.bronze - a.bronze || a.college.localeCompare(b.college)
    })
    return goldSorted.slice(0, 3)
  }, [rows])

  // ── Sort setter ───────────────────────────────────────

  const setSortKey = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'desc' ? 'asc' : 'desc' }
        : { key, direction: key === 'college' ? 'asc' : 'desc' },
    )

  // ── Crew resolver ─────────────────────────────────────

  const getCrew = (college: string) => CREWS[college] ?? DEFAULT_CREW

  return {
    rows,
    sorted,
    topThree,
    results,
    totals,
    sort,
    setSortKey,
    loading,
    syncing,
    error,
    updatedAt,
    stale,
    reload: () => void load(true),
    getCrew,
  }
}
