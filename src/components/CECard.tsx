import type { CraftEssence } from '../types'
import { groupOf } from '../lib/bond'
import { bonusLine, stars, textSource } from '../lib/format'
import { Portrait } from './ServantIcon'
import { CopyStepper } from './CopyStepper'

export function CECard({
  ce,
  copies = 0,
  onCopies,
  extra,
}: {
  ce: CraftEssence
  copies?: number
  onCopies?: (copies: number) => void
  extra?: string
}) {
  const group = groupOf(ce)
  const totals = ce.parts.reduce(
    (sum, part) => ({
      base: sum.base + (part.flat ? 0 : part.base),
      mlb: sum.mlb + (part.flat ? 0 : part.mlb),
      flatBase: sum.flatBase + (part.flat ? part.base : 0),
      flatMlb: sum.flatMlb + (part.flat ? part.mlb : 0),
    }),
    { base: 0, mlb: 0, flatBase: 0, flatMlb: 0 },
  )
  const selected = copies > 0
  const body = (
    <>
      <Portrait src={ce.face} name={ce.name} rarity={ce.rarity} size={52} badge={ce.cn ? undefined : '日'} />
      <span>
        <h3>
          {ce.name}
          {ce.cn ? '' : <span className="tag-jp"> · 日服未实装</span>}
        </h3>
        <p>
          {group?.label ?? '条件'} · {bonusLine(totals.base, totals.mlb, totals.flatBase, totals.flatMlb)}
        </p>
        <p className="ce-tags">
          No.{ce.no} · {stars(ce.rarity)} · {ce.obtain}
        </p>
        <p className="clamp">
          {textSource(ce.textFrom)}：{ce.text}
        </p>
        {extra ? <p>{extra}</p> : null}
      </span>
    </>
  )
  return (
    <article className={selected ? 'ce-card on' : 'ce-card'} data-ce={ce.no}>
      {onCopies ? (
        <button type="button" className="ce-main" onClick={() => onCopies(selected ? 0 : 1)} aria-pressed={selected}>
          {body}
        </button>
      ) : (
        <div className="ce-main">{body}</div>
      )}
      {onCopies ? <CopyStepper value={copies} onChange={onCopies} /> : null}
    </article>
  )
}
