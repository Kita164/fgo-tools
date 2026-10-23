import type { Region } from '../types'

const OPTIONS: { id: Region; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'cn', label: '国服已实装' },
  { id: 'jp', label: '日服未实装' },
]

export function RegionFilter({ value, onChange }: { value: Region; onChange: (region: Region) => void }) {
  return (
    <div className="chips" role="toolbar" aria-label="服务器">
      {OPTIONS.map((option) => (
        <button
          type="button"
          key={option.id}
          className={value === option.id ? 'on' : ''}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
