import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CECard } from '../components/CECard'
import { ServantFilters } from '../components/ServantFilters'
import { ServantGrid } from '../components/ServantGrid'
import { cesNewest, classOptions, groupOf, matchServant, sameCondition, servantsForCe } from '../lib/bond'
import type { Region } from '../types'

const classes = classOptions()

export function GroupPage() {
  const [params, setParams] = useSearchParams()
  const initial = Number(params.get('ce'))
  const [ceNo, setCeNo] = useState(() => (cesNewest.some((ce) => ce.no === initial) ? initial : cesNewest[0].no))
  const [classId, setClassId] = useState('')
  const [region, setRegion] = useState<Region>('all')
  const [text, setText] = useState('')

  useEffect(() => {
    document.title = '按礼装查看羁绊从者 · FGO 工具'
  }, [])

  const ce = cesNewest.find((item) => item.no === ceNo) ?? cesNewest[0]
  const group = groupOf(ce)
  const siblings = sameCondition(ce)
  const rows = useMemo(() => servantsForCe(ce.id), [ce.id])
  const shown = rows.filter((row) => matchServant(row.servant, { classId, region, text }))
  const partials = shown.filter((row) => row.partial).length

  function choose(no: number) {
    setCeNo(no)
    setParams({ ce: String(no) }, { replace: true })
  }

  return (
    <>
      <h1>按礼装查看</h1>
      <p className="lede">每张礼装下面是满足它条件的全部从者。带 * 且头像变淡的，只在部分灵基或灵衣下生效。</p>
      <div className="ce-picks">
        {cesNewest.map((item) => (
          <button type="button" key={item.id} className={item.no === ce.no ? 'on' : ''} onClick={() => choose(item.no)}>
            {item.name}
            <small>{groupOf(item)?.label}</small>
          </button>
        ))}
      </div>
      <CECard
        ce={ce}
        extra={
          siblings.length
            ? `同一条件还有：${siblings.map((item) => item.name).join('、')}`
            : undefined
        }
      />
      <div className="section-head">
        <h2>{group?.label}</h2>
        <span className="count">
          {shown.length} 名{partials ? ` · 其中部分灵基 ${partials} 名` : ''}
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
      <ServantGrid items={shown.map((row) => ({ servant: row.servant, partial: row.partial }))} />
    </>
  )
}
