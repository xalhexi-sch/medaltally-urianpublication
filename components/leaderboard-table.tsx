'use client'

import { type MedalRow, getCollegeInfo } from '@/types/leaderboard'
import { CrewLogo } from './crew-logo'

interface LeaderboardTableProps {
  sorted: MedalRow[]
}

const MEDAL_COLUMNS = [
  { key: 'gold', label: 'Gold', icon: '🥇' },
  { key: 'silver', label: 'Silver', icon: '🥈' },
  { key: 'bronze', label: 'Bronze', icon: '🥉' },
  { key: 'total', label: 'Total', icon: '🏆' },
]

function getOrdinalRank(index: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = index % 100
  return index + (s[(v - 20) % 10] || s[v] || s[0])
}

export function LeaderboardTable({ sorted }: LeaderboardTableProps) {
  return (
    <div className="table-container">
      {/* Table Column Headers — Pixel-aligned directly with row columns */}
      <div className="table-header-row" role="row">
        <div className="th-rank-col">Rank</div>
        <div className="th-college-col">College</div>

        {/* Scoreboard Column Icons — Clean & prominent medal badges */}
        <div className="th-scores-container" role="rowheader">
          {MEDAL_COLUMNS.map(({ key, label, icon }, idx) => {
            const isTotal = key === 'total'

            return (
              <div key={key} className="th-score-cell-wrap">
                {idx > 0 && <div className={`th-score-sep ${isTotal ? 'th-score-sep-major' : ''}`} />}
                <div
                  className={`th-medal-slot ${isTotal ? 'th-total-slot' : ''}`}
                  title={`${label} Medals`}
                  aria-label={`${label} Medals`}
                >
                  <span className="th-medal-emoji">{icon}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Solid Broadcast Banner Rows */}
      <div className="broadcast-rows-list" role="list">
        {sorted.map((row, index) => {
          const college = getCollegeInfo(row.college)
          const isChampion = index === 0
          const displayRank = isChampion ? '🏆' : getOrdinalRank(index)
          const rankClass = isChampion ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : 'rank-other'

          return (
            <article
              key={row.college}
              className={`broadcast-row-banner ${rankClass}`}
              style={
                {
                  '--college-color': college.color,
                  '--row-index': index,
                } as React.CSSProperties
              }
              role="listitem"
            >
              {/* Rank Slot */}
              <div className="banner-rank-slot">
                <span
                  className={`banner-rank-badge ${rankClass} ${isChampion ? 'banner-rank-trophy' : ''}`}
                  title={isChampion ? 'Overall Champion' : `${displayRank} Place`}
                >
                  {displayRank}
                </span>
              </div>

              {/* Angled White Tab with College Emblem */}
              <div className="banner-logo-tab">
                <CrewLogo college={row.college} size="md" />
              </div>

              {/* Solid Colored College Banner Body */}
              <div className="banner-body">
                <div className="banner-college-text">
                  <span className="banner-college-code">{college.short}</span>
                  <span className="banner-college-fullname">{college.name}</span>
                </div>
                <div className="banner-shine-overlay" />
              </div>

              {/* Scoreboard Medal Cells — Perfectly aligned with header medal icons */}
              <div className="banner-scores-group">
                <div className="score-slot score-gold">
                  <span className="score-num">{String(row.gold).padStart(2, '0')}</span>
                </div>

                <div className="score-divider" />

                <div className="score-slot score-silver">
                  <span className="score-num">{String(row.silver).padStart(2, '0')}</span>
                </div>

                <div className="score-divider" />

                <div className="score-slot score-bronze">
                  <span className="score-num">{String(row.bronze).padStart(2, '0')}</span>
                </div>

                <div className="score-divider score-divider-major" />

                <div className="score-slot score-total">
                  <span className="score-num total-bold">{String(row.total).padStart(2, '0')}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
