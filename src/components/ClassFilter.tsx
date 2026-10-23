export function ClassFilter({
  classes,
  value,
  onChange,
}: {
  classes: { id: string; name: string }[]
  value: string
  onChange: (classId: string) => void
}) {
  return (
    <div className="chips" role="toolbar" aria-label="职阶">
      <button type="button" className={value === '' ? 'on' : ''} onClick={() => onChange('')}>
        全部职阶
      </button>
      {classes.map((item) => (
        <button
          type="button"
          key={item.id}
          className={value === item.id ? 'on' : ''}
          onClick={() => onChange(item.id)}
        >
          {item.name}
        </button>
      ))}
    </div>
  )
}
