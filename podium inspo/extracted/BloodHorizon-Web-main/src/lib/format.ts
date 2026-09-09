export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0m';
  }

  const units = [
    { label: 'y', value: 60 * 60 * 24 * 365 },
    { label: 'mo', value: 60 * 60 * 24 * 30 },
    { label: 'w', value: 60 * 60 * 24 * 7 },
    { label: 'd', value: 60 * 60 * 24 },
    { label: 'h', value: 60 * 60 },
    { label: 'm', value: 60 },
  ];

  let remaining = Math.floor(seconds);
  const parts: string[] = [];

  for (const unit of units) {
    if (remaining >= unit.value) {
      const amount = Math.floor(remaining / unit.value);
      remaining -= amount * unit.value;
      parts.push(`${amount}${unit.label}`);
    }
    if (parts.length === 2) {
      break;
    }
  }

  if (!parts.length) {
    return `${Math.max(Math.floor(remaining), 1)}s`;
  }

  return parts.join(' ');
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) {
    return 'BH';
  }
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function calculateKd(kills: number, deaths: number): string {
  if (!deaths) {
    return kills > 0 ? kills.toFixed(2) : '0.00';
  }
  return (kills / deaths).toFixed(2);
}
