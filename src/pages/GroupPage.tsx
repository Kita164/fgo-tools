import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CECard } from '../components/CECard'
import { ServantFilters } from '../components/ServantFilters'
import { ServantGrid } from '../components/ServantGrid'
import { cesNewest, classOptions, groupOf, matchServant, sameCondition, servantsForCes } from '../lib/bond'
import { bonusLine } from '../lib/format'
import type { Region } from '../types'

const classes = classOptions()
const knownNos = new Set(cesNewest.map((ce) => ce.no))

function parseSelection(raw: string | null): number[] {
  if (!raw) return []
  const seen = new Set<number>()
  const selected: number[] = []
  for (const part of raw.split(',')) {
    const no = Number(part)
    if (!knownNos.has(no) || seen.has(no)) continue
    seen.add(no)
    selected.push(no)
  }
  return selected
}

export function GroupPage() {
  const [params, setParams] = useSearchParams()
  const selected = parseSelection(params.get('ce'))
  const [classId, setClassId] = useState('')
  const [region, setRegion] = useState<Region>('all')
  const [text, setText] = useState('')

  useEffect(() => {
    document.title = '按礼装查看羁绊从者 · FGO 工具'
  }, [])

  const selectedCes = selected
    .map((no) => cesNewest.find((ce) => ce.no === no))
    .filter((ce) => ce !== undefined)
  const selectedKey = selectedCes.map((ce) => ce.id).join(',')
  const rows = useMemo(() => servantsForCes(selectedCes.map((ce) => ce.id)), [selectedKey])
  const shown = rows.filter((row) => matchServant(row.servant, { classId, region, text }))
  const partials = shown.filter((row) => row.partial).length
  const only = selectedCes.length === 1 ? selectedCes[0] : null
  const total = rows[0]

  function write(next: number[]) {
    if (next.length) setParams({ ce: next.join(',') }, { replace: true })
    else setParams({}, { replace: true })
  }

  function toggle(no: number) {
    write(selected.includes(no) ? selected.filter((item) => item !== no) : [...selected, no])
  }

  return (
    <>
      <h1>按礼装查看</h1>
      <p className="lede">
        点礼装选中，再点一次取消。多选时只留下同时满足全部条件的从者，并按每张 1 份把加成加总。带 * 且头像变淡的，至少有一张礼装只在部分灵基或灵衣下生效。
      </p>
      <div className="ce-picks">
        {cesNewest.map((item) => {
          const on = selected.includes(item.no)
          return (
            <button
              type="button"
              key={item.id}
              className={on ? 'on' : ''}
              aria-pressed={on}
              onClick={() => toggle(item.no)}
            >
              <span className="pick-name">{item.name}</span>
              <small>{groupOf(item)?.label}</small>
            </button>
          )
        })}
      </div>
      <div className="pick-bar">
        <span className="count">已选 {selected.length} 张</span>
        <button type="button" className="btn ghost" disabled={selected.length === 0} onClick={() => write([])}>
          清空
        </button>
      </div>

      {selectedCes.length === 0 ? (
        <p className="empty">先选择礼装。可以多选。</p>
      ) : (
        <>
          {only ? (
            <CECard
              ce={only}
              extra={
                sameCondition(only).length
                  ? `同一条件还有：${sameCondition(only)
                      .map((item) => item.name)
                      .join('、')}`
                  : undefined
              }
            />
          ) : null}
          <div className="section-head">
            <h2>{only ? groupOf(only)?.label : `同时满足全部 ${selectedCes.length} 张`}</h2>
            <span className="count">
              {shown.length} 名
              {partials ? ` · 其中部分灵基 ${partials} 名` : ''}
              {selectedCes.length > 1 && total
                ? ` · 每人 ${bonusLine(total.base, total.mlb, total.flatBase, total.flatMlb)}`
                : ''}
            </span>
          </div>
          <ServantFilters
            classes={classes}
            classId={classId}
            region={region}
            text={text}
            onClass={setClassId}
            onRegion={setRegion}
            onText={setText}
          />
          <ServantGrid
            items={shown.map((row) => ({
              servant: row.servant,
              partial: row.partial,
              sub:
                selectedCes.length > 1
                  ? bonusLine(row.base, row.mlb, row.flatBase, row.flatMlb)
                  : undefined,
            }))}
          />
        </>
      )}
    </>
  )
}
