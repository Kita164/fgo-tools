import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CECard } from '../components/CECard'
import { ServantFilters } from '../components/ServantFilters'
import { ServantGrid } from '../components/ServantGrid'
import type { Tile } from '../components/ServantGrid'
import {
  ceById,
  cesNewest,
  classOptions,
  data,
  evaluate,
  matchServant,
  partTotals,
  servantById,
} from '../lib/bond'
import { bonusLine } from '../lib/format'
import type { Region } from '../types'

const NEAR_CAP = 180
const classes = classOptions()

function readPicks(raw: string | null): Record<number, number> {
  const next: Record<number, number> = {}
  if (!raw) return next
  for (const chunk of raw.split(',')) {
    const [noText, copyText] = chunk.split('.')
    const ce = data.ces.find((item) => item.no === Number(noText))
    if (!ce) continue
    const copies = Math.max(1, Math.min(6, Number(copyText) || 1))
    next[ce.id] = copies
  }
  return next
}

export function ComboPage() {
  const [params] = useSearchParams()
  const [copies, setCopies] = useState<Record<number, number>>(() => readPicks(params.get('pick')))
  const [cnOnly, setCnOnly] = useState(false)
  const [classId, setClassId] = useState('')
  const [region, setRegion] = useState<Region>('all')
  const [text, setText] = useState('')

  useEffect(() => {
    document.title = '羁绊加成礼装组合查询 · FGO 工具'
  }, [])

  const picks = useMemo(
    () =>
      Object.entries(copies)
        .map(([id, count]) => ({ ceId: Number(id), copies: count }))
        .filter((pick) => pick.copies > 0),
    [copies],
  )
  const copyTotal = picks.reduce((sum, pick) => sum + pick.copies, 0)
  const result = useMemo(() => evaluate(picks), [picks])
  const query = { classId, region, text }
  const full = result.full.filter((hit) => matchServant(servantById.get(hit.servantId)!, query))
  const near = result.near.filter((hit) => matchServant(servantById.get(hit.servantId)!, query))
  const header = picks.reduce(
    (sum, pick) => {
      const totals = partTotals(ceById.get(pick.ceId)!, pick.copies)
      return {
        base: sum.base + totals.base,
        mlb: sum.mlb + totals.mlb,
        flatBase: sum.flatBase + totals.flatBase,
        flatMlb: sum.flatMlb + totals.flatMlb,
      }
    },
    { base: 0, mlb: 0, flatBase: 0, flatMlb: 0 },
  )
  const visibleCes = cesNewest.filter((ce) => !cnOnly || ce.cn)
  const fullTiles: Tile[] = full.map((hit) => ({
    servant: servantById.get(hit.servantId)!,
    partial: hit.partial,
    tip: hit.partial ? '只在部分灵基或灵衣下同时满足全部条件' : undefined,
  }))
  const nearTiles: Tile[] = near.slice(0, NEAR_CAP).map((hit) => {
    const names = hit.missed.map((id) => ceById.get(id)?.name).filter(Boolean)
    const tips = []
    if (names.length) tips.push(`不满足：${names.join('、')}`)
    if (hit.matched === hit.total && hit.mask === 0) tips.push('这些条件分属不同灵基，不能同时生效')
    return {
      servant: servantById.get(hit.servantId)!,
      partial: hit.partial,
      sub: `${hit.matched}/${hit.total} · 满破 ${bonusLine(hit.mlb, hit.mlb, hit.flatMlb, hit.flatMlb)}`,
      tip: tips.join('。'),
    }
  })

  return (
    <div className={picks.length ? 'with-dock' : undefined}>
      <h1>羁绊加成礼装组合查询</h1>
      <p className="lede">
        只收录带从者条件的羁绊礼装，例如「献给幸福的新娘」只给秩序且女性的从者。午茶、午餐、晚餐这类谁都能吃到的，以及活动里没有从者条件的自用礼装，都不在这里。已排除 {data.meta.excludedCount}{' '}
        张，包括{data.meta.excludedSample.slice(0, 4).join('、')}等。
      </p>
      <p>
        <button type="button" className={cnOnly ? 'check on' : 'check'} onClick={() => setCnOnly((value) => !value)}>
          只列国服已实装的礼装
        </button>
      </p>
      <div className="ce-grid">
        {visibleCes.map((ce) => (
          <CECard
            key={ce.id}
            ce={ce}
            copies={copies[ce.id] ?? 0}
            onCopies={(count) => setCopies((prev) => ({ ...prev, [ce.id]: Math.max(0, Math.min(6, count)) }))}
          />
        ))}
      </div>

      <section id="results">
        {picks.length ? (
          <>
            <div className="section-head">
              <h2>同时满足</h2>
              <span className="count">
                {full.length} 名 · 未满破 {bonusLine(header.base, header.base, header.flatBase, header.flatBase)} · 满破{' '}
                {bonusLine(header.mlb, header.mlb, header.flatMlb, header.flatMlb)}
              </span>
            </div>
            <p className="lede">
              {picks
                .map((pick) => {
                  const ce = ceById.get(pick.ceId)!
                  const totals = partTotals(ce, pick.copies)
                  return `${ce.name} ×${pick.copies}（满破 ${bonusLine(totals.mlb, totals.mlb, totals.flatMlb, totals.flatMlb)}）`
                })
                .join(' + ')}
              。头像变淡并带 * 的从者，只在部分灵基或灵衣下能同时吃到这些加成。
            </p>
            <ServantFilters
              classes={classes}
              classId={classId}
              region={region}
              text={text}
              onClass={setClassId}
              onRegion={setRegion}
              onText={setText}
            />
            <ServantGrid items={fullTiles} />
            <h2>只满足一部分</h2>
            <p className="lede">
              按命中的礼装种数、再按满破合计排序。头像下方是「命中种数 / 已选种数 · 满破合计」。悬停可以看缺哪一张。
            </p>
            <ServantGrid items={nearTiles} />
            {near.length > NEAR_CAP ? <p className="empty">还有 {near.length - NEAR_CAP} 名，用上面的筛选缩小范围。</p> : null}
          </>
        ) : (
          <p className="empty">先在上面选一张或多张礼装。点卡片选中，右侧加减号改张数，一队含助战最多 6 个位置。</p>
        )}
        <h2>怎么算的</h2>
        <ul className="notes">
          {data.meta.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      {picks.length ? (
        <div className="dock">
          <div>
            <b>
              已选 {picks.length} 种 / {copyTotal} 张
            </b>
            <span className="sub">
              未满破 {bonusLine(header.base, header.base, header.flatBase, header.flatBase)} · 满破{' '}
              {bonusLine(header.mlb, header.mlb, header.flatMlb, header.flatMlb)}
              {copyTotal > 6 ? <span className="warn"> · 超过 6 个位置，一队带不下</span> : null}
            </span>
          </div>
          <div className="dock-actions">
            <button type="button" onClick={() => setCopies({})}>
              清空
            </button>
            <a href="#results">看结果</a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
