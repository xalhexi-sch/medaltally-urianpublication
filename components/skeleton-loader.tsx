'use client'

export function SkeletonLoader() {
  return (
    <div className="skeleton-loader" role="status" aria-label="Loading leaderboard data">
      {/* Skeleton table rows */}
      <div className="skeleton-table">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="skeleton-row"
            style={{ '--row-delay': `${i * 100}ms` } as React.CSSProperties}
          >
            <div className="skeleton skeleton-rank" />
            <div className="skeleton skeleton-logo" />
            <div className="skeleton-col">
              <div className="skeleton skeleton-name" />
              <div className="skeleton skeleton-role" />
            </div>
            <div className="skeleton skeleton-num" />
            <div className="skeleton skeleton-num" />
            <div className="skeleton skeleton-num" />
            <div className="skeleton skeleton-num" />
          </div>
        ))}
      </div>
      <p className="skeleton-msg">Syncing the tally…</p>
    </div>
  )
}
