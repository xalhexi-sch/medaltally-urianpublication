'use client'

import { useState } from 'react'
import { getCollegeInfo } from '@/types/leaderboard'

const SIZES = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 72,
  '2xl': 88,
} as const

type LogoSize = keyof typeof SIZES

interface CrewLogoProps {
  college: string
  size?: LogoSize
  className?: string
  priority?: boolean
}

export function CrewLogo({ college, size = 'md', className = '', priority = false }: CrewLogoProps) {
  const [failed, setFailed] = useState(false)
  const collegeInfo = getCollegeInfo(college)
  const px = SIZES[size]
  const code = college.toUpperCase()
  const logoPath = code === 'CON' ? '/logos/CON_COLLEGE.PNG' : `/logos/${code}.PNG`

  if (failed) {
    return (
      <span
        className={`crew-initials crew-initials-${size} ${className}`}
        style={{ '--college-color': collegeInfo.color } as React.CSSProperties}
        role="img"
        aria-label={`${collegeInfo.short} Logo`}
      >
        {college.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return (
    <img
      src={logoPath}
      alt={`${collegeInfo.short} Logo`}
      width={px}
      height={px}
      className={`crew-logo crew-logo-${size} ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  )
}
