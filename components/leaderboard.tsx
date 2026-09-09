'use client'

import { useEffect, useState } from 'react'
import { SOURCE_URL } from '@/types/leaderboard'
import { useLeaderboard, relativeTime } from '@/hooks/use-leaderboard'
import { ChampionPodium } from './champion-podium'
import { LeaderboardTable } from './leaderboard-table'
import { SkeletonLoader } from './skeleton-loader'

export function Leaderboard() {
  const {
    sorted,
    topThree,
    results,
    sort,
    setSortKey,
    loading,
    syncing,
    error,
    updatedAt,
    reload,
  } = useLeaderboard()

  const [timeLabel, setTimeLabel] = useState(() => relativeTime(updatedAt))
  useEffect(() => {
    setTimeLabel(relativeTime(updatedAt))
    const tick = window.setInterval(() => setTimeLabel(relativeTime(updatedAt)), 15_000)
    return () => window.clearInterval(tick)
  }, [updatedAt])

  return (
    <main className="scoreboard-shell">
      {/* ── Urian Publication Top Brand Bar ─────────────── */}
      <nav className="brand-header-bar" aria-label="Official Publication Header">
        <a
          href="https://urianpublication.com"
          target="_blank"
          rel="noreferrer"
          className="brand-logo-link"
          title="Visit Urian Publication Official Website"
        >
          <img
            src="/urian-pub-logo.png"
            alt="Urian Publication Logo"
            className="brand-icon-img"
            width={38}
            height={38}
          />
          <div className="brand-text-group">
            <span className="brand-title">Urian Publication</span>
            <span className="brand-subtitle">Official Student Media</span>
          </div>
        </a>

        <a
          href="https://urianpublication.com"
          target="_blank"
          rel="noreferrer"
          className="brand-site-badge"
        >
          urianpublication.com ↗
        </a>
      </nav>

      {/* ── Hero Header ─────────────────────────────────── */}
      <header className="hero">
        <div className="hero-title-area">
          <p className="eyebrow">125th University Days</p>
          <h1>Medal Tally</h1>
        </div>

        {/* Status */}
        <div className="hero-actions">
          <span className="live-pill" aria-label="Live updates active">
            <i className="live-indicator" /> Live
          </span>
        </div>
      </header>

      {/* ── Standing Podium Section ──────────────────────── */}
      <ChampionPodium topThree={topThree} loading={loading} />

      {/* ── College Leaderboard Card ─────────────────────── */}
      <section className="leaderboard-card" aria-labelledby="standings-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Standings</p>
            <h2 id="standings-title">College Leaderboard</h2>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="error-state" role="alert">
            <strong>Scoreboard unavailable</strong>
            <p>Could not read the latest tally from the source sheet.</p>
            <div className="error-actions">
              <button onClick={reload}>Try again</button>
              <a href={SOURCE_URL} target="_blank" rel="noreferrer">
                View source
              </a>
            </div>
          </div>
        ) : (
          <>
            <LeaderboardTable sorted={sorted} sort={sort} setSortKey={setSortKey} />

            <details className="event-results">
              <summary>
                Show results by event <span>{results.length} recorded</span>
              </summary>
              <div className="event-list">
                {results.length ? (
                  results.map((result) => (
                    <article className="event-result" key={result.event}>
                      <strong>{result.event}</strong>
                      <div className="event-medals-list">
                        <span className="result-gold">🥇 Gold: {result.gold ?? '—'}</span>
                        <span className="result-silver">🥈 Silver: {result.silver ?? '—'}</span>
                        <span className="result-bronze">🥉 Bronze: {result.bronze ?? '—'}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-events">No event results have been published yet.</p>
                )}
              </div>
            </details>
          </>
        )}
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <img
              src="/urian-pub-logo.png"
              alt="Urian Publication Logo"
              width={22}
              height={22}
              className="footer-brand-icon"
            />
            <span>
              Official Coverage by{' '}
              <a href="https://urianpublication.com" target="_blank" rel="noreferrer">
                Urian Publication
              </a>
            </span>
          </div>
          <div className="footer-meta">
            <span>
              Source:{' '}
              <a href={SOURCE_URL} target="_blank" rel="noreferrer">
                Foundation Anniversary
              </a>
            </span>
            <span aria-live="polite">
              {syncing ? (
                <>
                  <i className="syncing-dot" /> Syncing…
                </>
              ) : (
                <>Updated {timeLabel}</>
              )}
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}
