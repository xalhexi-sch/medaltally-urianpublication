'use client'

import { type MedalRow, getCollegeInfo } from '@/types/leaderboard'
import { CrewLogo } from './crew-logo'

interface ChampionPodiumProps {
  topThree: MedalRow[]
  loading?: boolean
}

function PodiumCard({
  row,
  place,
  delay,
}: {
  row: MedalRow
  place: 1 | 2 | 3
  delay: number
}) {
  const college = getCollegeInfo(row.college)

  const config = {
    1: {
      blockHeight: 'podium-block-1st',
      avatarSize: 'xl' as const,
      crown: true,
      glowRing: 'podium-ring-gold',
      badgeClass: 'podium-pill-gold',
      pillarClass: 'podium-pillar-gold',
    },
    2: {
      blockHeight: 'podium-block-2nd',
      avatarSize: 'lg' as const,
      crown: false,
      glowRing: 'podium-ring-silver',
      badgeClass: 'podium-pill-silver',
      pillarClass: 'podium-pillar-silver',
    },
    3: {
      blockHeight: 'podium-block-3rd',
      avatarSize: 'lg' as const,
      crown: false,
      glowRing: 'podium-ring-bronze',
      badgeClass: 'podium-pill-bronze',
      pillarClass: 'podium-pillar-bronze',
    },
  }[place]

  return (
    <div
      className={`podium-card podium-card-${place}`}
      style={
        {
          '--podium-delay': `${delay}ms`,
          '--college-color': college.color,
        } as React.CSSProperties
      }
    >
      {/* Crown for 1st place */}
      {config.crown && (
        <div className="podium-crown" aria-hidden="true">
          <svg className="crown-svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
          </svg>
        </div>
      )}

      {/* Avatar with illuminated glowing ring & small rank badge */}
      <div className={`podium-avatar-wrapper ${config.glowRing}`}>
        <CrewLogo college={row.college} size={config.avatarSize} priority />
        <div className={`podium-rank-badge ${config.badgeClass}`}>
          {place}
        </div>
      </div>

      {/* College Identification above the block */}
      <div className="podium-info">
        <h3 className="podium-college-title">{college.short}</h3>
        <p className="podium-college-subtitle">{college.name}</p>
      </div>

      {/* The Solid Podium Block containing the actual data */}
      <div className={`podium-pillar ${config.pillarClass} ${config.blockHeight}`}>
        <div className="podium-data-body">
          <span className="podium-total-number">{row.total}</span>
          <span className="podium-total-caption">TOTAL MEDALS</span>
        </div>

        {/* Bottom Translucent Medal Breakdown Strip */}
        <div className="podium-data-strip">
          <span className="strip-stat gold">
            <span className="stat-icon">🥇</span> {row.gold}
          </span>
          <span className="strip-stat silver">
            <span className="stat-icon">🥈</span> {row.silver}
          </span>
          <span className="strip-stat bronze">
            <span className="stat-icon">🥉</span> {row.bronze}
          </span>
        </div>

        {/* Dynamic gloss sweep */}
        <div className="podium-pillar-shine" />
      </div>
    </div>
  )
}

function PodiumSkeleton({ place }: { place: 1 | 2 | 3 }) {
  const heights = { 1: 'podium-block-1st', 2: 'podium-block-2nd', 3: 'podium-block-3rd' }
  return (
    <div className={`podium-card podium-card-${place}`}>
      <div className="skeleton podium-skel-avatar" />
      <div className="skeleton podium-skel-text" />
      <div className={`podium-pillar podium-pillar-skeleton ${heights[place]}`} />
    </div>
  )
}

export function ChampionPodium({ topThree, loading }: ChampionPodiumProps) {
  if (loading) {
    return (
      <section className="podium-section" aria-label="Standings podium">
        <div className="podium-stage-container">
          <div className="podium-grid">
            <PodiumSkeleton place={2} />
            <PodiumSkeleton place={1} />
            <PodiumSkeleton place={3} />
          </div>
          <div className="podium-stage-floor" />
        </div>
      </section>
    )
  }

  if (topThree.length === 0) {
    return (
      <section className="podium-section" aria-label="Standings podium">
        <p className="podium-empty">Standings will appear once initial event results are verified.</p>
      </section>
    )
  }

  const first = topThree[0]
  const second = topThree[1]
  const third = topThree[2]

  return (
    <section className="podium-section" aria-label="Standings podium">
      <div className="podium-stage-container">
        <div className="podium-grid">
          {second && <PodiumCard row={second} place={2} delay={120} />}
          {first && <PodiumCard row={first} place={1} delay={0} />}
          {third && <PodiumCard row={third} place={3} delay={240} />}
        </div>
        {/* Grounding stage base */}
        <div className="podium-stage-floor" />
      </div>
    </section>
  )
}
