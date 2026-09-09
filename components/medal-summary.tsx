'use client'

interface MedalSummaryProps {
  gold: number
  silver: number
  bronze: number
}

function Medal({ label, value }: { label: string; value: number }) {
  return (
    <div className={`medal medal-${label.toLowerCase()}`}>
      <span className="medal-mark">
        {label === 'Gold' ? 'G' : label === 'Silver' ? 'S' : 'B'}
      </span>
      <div>
        <span className="medal-label">{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

export function MedalSummary({ gold, silver, bronze }: MedalSummaryProps) {
  return (
    <section className="summary" aria-label="Medal totals">
      <Medal label="Gold" value={gold} />
      <Medal label="Silver" value={silver} />
      <Medal label="Bronze" value={bronze} />
    </section>
  )
}
