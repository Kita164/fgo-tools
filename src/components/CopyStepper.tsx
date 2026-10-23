export function CopyStepper({
  value,
  onChange,
  max = 6,
}: {
  value: number
  onChange: (value: number) => void
  max?: number
}) {
  return (
    <div className="stepper">
      <button
        type="button"
        aria-label="减少张数"
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span>{value ? `×${value}` : '0'}</span>
      <button
        type="button"
        aria-label="增加张数"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
