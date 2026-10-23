export function fmt(value: number): string {
  if (!Number.isFinite(value)) return '0'
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export function bonusLine(base: number, mlb: number, flatBase = 0, flatMlb = 0): string {
  const parts: string[] = []
  const hasPercent = base !== 0 || mlb !== 0 || (flatBase === 0 && flatMlb === 0)
  if (hasPercent) {
    parts.push(base === mlb ? `+${fmt(base)}%` : `+${fmt(base)}%（满破 +${fmt(mlb)}%）`)
  }
  if (flatBase !== 0 || flatMlb !== 0) {
    parts.push(flatBase === flatMlb ? `+${fmt(flatBase)}点` : `+${fmt(flatBase)}点（满破 +${fmt(flatMlb)}点）`)
  }
  return parts.join('，')
}

export function stars(rarity: number): string {
  return '★'.repeat(Math.max(0, Math.min(5, rarity)))
}

export function textSource(from: 'cn' | 'jp' | 'translation'): string {
  if (from === 'cn') return '国服描述'
  if (from === 'translation') return '译文'
  return '日服原文'
}
