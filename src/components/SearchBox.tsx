export function SearchBox({
  value,
  onChange,
  placeholder = '名字或图鉴编号',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="search">
      <span className="sr">搜索从者</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
