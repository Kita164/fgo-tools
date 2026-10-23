import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CECard } from '../components/CECard'
import { ServantFilters } from '../components/ServantFilters'
import { ServantGrid } from '../components/ServantGrid'
import { ServantIcon } from '../components/ServantIcon'
import {
  applicableTo,
  bestStack,
  classOptions,
  data,
  groupOf,
  matchServant,
  servantById,
} from '../lib/bond'
import { bonusLine } from '../lib/format'
import type { Region, Servant } from '../types'

const classes = classOptions()

export function ServantPage() {
  const [params, setParams] = useSearchParams()
  const [classId, setClassId] = useState('')
  const [region, setRegion] = useState<Region>('all')
  const [text, setText] = useState('')
  const selected = servantById.get(
    data.servants.find((servant) => servant.no === Number(params.get('no')))?.id ?? -1,
  )

  useEffect(() => {
    document.title = selected ? `${selected.name} 的羁绊礼装 · FGO 工具` : '按从者反查羁绊礼装 · FGO 工具'
  }, [selected])

  const shown = useMemo(
    () => data.servants.filter((servant) => matchServant(servant, { classId, region, text })),
    [classId, region, text],
  )
  const apps = selected ? applicableTo(selected.id) : []
  const best = bestStack(apps)

  function pick(servant: Servant) {
    setParams({ no: String(servant.no) }, { replace: true })
  }

  return (
    <>
      <h1>按从者反查</h1>
      <p className="lede">点一个从者，看哪些有条件的羁绊礼装对他有效，以及同一灵基上能叠到多少。</p>
      <ServantFilters
        classes={classes}
        classId={classId}
        region={region}
        text={text}
        onClass={setClassId}
        onRegion={setRegion}
        onText={setText}
      />
      {selected && best ? (
        <section className="panel detail">
          <div className="detail-top">
            <ServantIcon servant={selected} size={72} />
            <div>
              <h2 style={{ margin: 0 }}>
                No.{selected.no} {selected.name}
              </h2>
              <p className="ce-tags">
                {selected.className}
                {selected.cn ? '' : ' · 日服未实装'}
                {selected.name !== selected.nameJp ? ` · ${selected.nameJp}` : ''}
              </p>
            </div>
          </div>
          <div className="kv">
            <div>
              <span>单张最高（满破）</span>
              <b>
                {best.top.ce.name} {bonusLine(best.top.base, best.top.mlb, best.top.flatBase, best.top.flatMlb)}
                {best.top.partial ? '（仅部分灵基）' : ''}
              </b>
            </div>
            <div>
              <span>各带 1 张、同一灵基可同时生效</span>
              <b>
                {best.together.count} 张 · 满破{' '}
                {bonusLine(best.together.mlb, best.together.mlb, best.together.flatMlb, best.together.flatMlb)}
                {best.together.partial ? '（含部分灵基）' : ''}
              </b>
            </div>
            <div>
              <span>一队 6 格都放最高那张满破</span>
              <b>{bonusLine(best.slot6Base, best.slot6Mlb, best.top.flatBase * 6, best.top.flatMlb * 6)}</b>
            </div>
          </div>
          <p>
            <Link className="btn" to={`/bond?pick=${apps.map((row) => `${row.ce.no}.1`).join(',')}`}>
              按每种 1 张放入组合
            </Link>
          </p>
          <div className="ce-grid">
            {apps.map((row) => (
              <CECard
                key={row.ce.id}
                ce={row.ce}
                extra={`${groupOf(row.ce)?.label ?? ''} · 对该从者 ${bonusLine(row.base, row.mlb, row.flatBase, row.flatMlb)}${row.partial ? ' · 仅部分灵基' : ''}`}
              />
            ))}
          </div>
        </section>
      ) : selected ? (
        <section className="panel detail">
          <div className="detail-top">
            <ServantIcon servant={selected} size={72} />
            <div>
              <h2 style={{ margin: 0 }}>
                No.{selected.no} {selected.name}
              </h2>
              <p className="ce-tags">
                {selected.className}
                {selected.cn ? '' : ' · 日服未实装'}
              </p>
            </div>
          </div>
          <p>没有适用的有条件羁绊礼装。</p>
        </section>
      ) : (
        <p className="empty">点下面的头像查看适用礼装。</p>
      )}
      <p className="count">
        {shown.length} / {data.servants.length} 名
      </p>
      <ServantGrid items={shown.map((servant) => ({ servant }))} onPick={pick} pickedId={selected?.id} />
    </>
  )
}
