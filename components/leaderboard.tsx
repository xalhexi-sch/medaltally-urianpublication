'use client'

import { SOURCE_URL, getCollegeInfo } from '@/types/leaderboard'
import { useLeaderboard } from '@/hooks/use-leaderboard'
import { ChampionPodium } from './champion-podium'
import { LeaderboardTable } from './leaderboard-table'
import { SkeletonLoader } from './skeleton-loader'
import { Confetti } from './confetti'
import { MusicPlayer } from './music-player'

export function Leaderboard() {
  const {
    sorted,
    topThree,
    results,
    loading,
    error,
    reload,
  } = useLeaderboard()

  return (
    <main className="scoreboard-shell">
      {/* ── Nonstop Celebratory Falling Confetti ─────────── */}
      <Confetti />

      {/* ── Automatic Background Soundtrack Player ───────── */}
      <MusicPlayer />

      {/* ── Minimal Brand Header ─────────────────────────── */}
      <header className="minimal-brand-header">
        <div className="top-right-status">
          <span className="live-pill final-pill" aria-label="Official Final Results">
            <span className="final-trophy-icon" aria-hidden="true">🏆</span> Final Results
          </span>
        </div>

        <a
          href="https://urianpublication.com"
          target="_blank"
          rel="noreferrer"
          className="minimal-brand-link"
          title="Visit Urian Publication Main Website"
        >
          <img
            src="/udays-125-header.png"
            alt="125th UDAYS — Urian Publication"
            className="minimal-brand-logo"
            width={420}
            height={158}
          />
        </a>
        <h1 className="minimal-brand-caption">The Urian Publication Special Coverage</h1>

        {/* ── Prominent Final Medal Tally Championship Title ── */}
        <div className="final-tally-title-wrap">
          <h2 className="final-tally-title">FINAL MEDAL TALLY</h2>
        </div>
      </header>

      {/* ── Standing Podium Section ──────────────────────── */}
      <ChampionPodium topThree={topThree} loading={loading} />

      {/* ── College Leaderboard Card ─────────────────────── */}
      <section className="leaderboard-card" aria-labelledby="standings-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Official Final Standings</p>
            <h2 id="standings-title">Final Medal Tally</h2>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <div className="error-state" role="alert">
            <strong>Scoreboard unavailable</strong>
            <p>Could not read the final tally from the source sheet.</p>
            <div className="error-actions">
              <button onClick={reload}>Try again</button>
              <a href={SOURCE_URL} target="_blank" rel="noreferrer">
                View source
              </a>
            </div>
          </div>
        ) : (
          <>
            <LeaderboardTable sorted={sorted} />

            <details className="event-results">
              <summary>
                Show results by event <span>{results.length} recorded</span>
              </summary>
              <div className="event-list">
                {results.length ? (
                  [...results].reverse().map((result) => (
                    <article className="event-result" key={result.event}>
                      <strong>{result.event}</strong>
                      <div className="event-medals-list">
                        <span className="result-gold">🥇 Gold: {result.gold ? getCollegeInfo(result.gold).short : '—'}</span>
                        <span className="result-silver">🥈 Silver: {result.silver ? getCollegeInfo(result.silver).short : '—'}</span>
                        <span className="result-bronze">🥉 Bronze: {result.bronze ? getCollegeInfo(result.bronze).short : '—'}</span>
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
        <div className="footer-meta">
          <span>
            Source:{' '}
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">
              Foundation Anniversary
            </a>
          </span>
          <span aria-live="polite">
            Official Final Results · 125th University Days
          </span>
        </div>
      </footer>
    </main>
  )
}
