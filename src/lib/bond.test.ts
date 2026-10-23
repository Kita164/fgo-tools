import { describe, expect, it } from 'vitest'
import { applicableTo, bestStack, data, evaluate, servantsForCe } from './bond'

const mash = data.servants.find((servant) => servant.no === 1)!
const bride = data.ces.find((ce) => ce.no === 2233)!
const report = data.ces.find((ce) => ce.no === 2052)!

describe('bond data', () => {
  it('includes the latest JP servant and CN names', () => {
    expect(data.meta.jpLatest.no).toBeGreaterThanOrEqual(482)
    expect(data.servants.some((servant) => servant.no === data.meta.jpLatest.no)).toBe(true)
    expect(mash.name).toBe('玛修·基列莱特')
    expect(mash.cn).toBe(true)
    const latest = data.servants.find((servant) => servant.no === data.meta.jpLatest.no)!
    expect(latest.cn).toBe(false)
    expect(latest.name).toBe(latest.nameJp)
  })

  it('keeps conditional bond CEs and drops universal or event-self CEs', () => {
    for (const no of [2233, 2052, 2437, 2509, 1949, 2607, 2701]) {
      expect(data.ces.some((ce) => ce.no === no)).toBe(true)
    }
    for (const no of [330, 910, 1121, 2512, 99]) {
      expect(data.ces.some((ce) => ce.no === no)).toBe(false)
    }
    const fsn = new Set(
      data.ces.filter((ce) => ce.no >= 1973 && ce.no <= 1979).map((ce) => ce.parts[0].groupId),
    )
    expect(fsn.size).toBe(1)
    const chaldea = data.ces.find((ce) => ce.no === 2509)!
    const group = data.groups.find((item) => item.id === chaldea.parts[0].groupId)!
    expect(group.label).toContain('七骑士')
    expect(group.label).toContain('本人')
  })
})

describe('combo', () => {
  it('puts Mash in the intersection of 秩序·女性 and 秩序·善', () => {
    const { full, near } = evaluate([
      { ceId: bride.id, copies: 1 },
      { ceId: report.id, copies: 1 },
    ])
    const hit = full.find((row) => row.servantId === mash.id)
    expect(hit).toBeTruthy()
    expect(hit?.partial).toBe(false)
    expect(hit?.base).toBe(8)
    expect(hit?.mlb).toBe(40)
    expect(near.some((row) => row.servantId === mash.id)).toBe(false)
    expect(full.length).toBeLessThan(data.servants.length)
  })

  it('multiplies the bonus by copy count', () => {
    const { full } = evaluate([
      { ceId: bride.id, copies: 2 },
      { ceId: report.id, copies: 1 },
    ])
    const hit = full.find((row) => row.servantId === mash.id)!
    expect(hit.base).toBe(12)
    expect(hit.mlb).toBe(60)
  })

  it('does not give Mash the saber-only CE', () => {
    const saber = data.ces.find((ce) => ce.no === 2607)!
    const { full } = evaluate([{ ceId: saber.id, copies: 1 }])
    expect(full.some((row) => row.servantId === mash.id)).toBe(false)
    expect(servantsForCe(saber.id).some((row) => row.servant.id === mash.id)).toBe(false)
    expect(servantsForCe(bride.id).some((row) => row.servant.id === mash.id && !row.partial)).toBe(true)
  })

  it('marks servants who only qualify on some ascensions', () => {
    const hibiki = data.servants.find((servant) => servant.no === 416)!
    const row = servantsForCe(bride.id).find((item) => item.servant.id === hibiki.id)
    expect(row?.partial).toBe(true)
    const { full } = evaluate([
      { ceId: bride.id, copies: 1 },
      { ceId: report.id, copies: 1 },
    ])
    const hit = full.find((item) => item.servantId === hibiki.id)
    expect(hit?.partial).toBe(true)
    expect(hit?.base).toBe(8)
    expect(hit?.mlb).toBe(40)
  })

  it('sums every CE Mash can use on one form', () => {
    const apps = applicableTo(mash.id)
    expect(apps.map((row) => row.ce.no)).toEqual(expect.arrayContaining([2233, 2052]))
    expect(apps.every((row) => !row.partial)).toBe(true)
    const best = bestStack(apps)
    expect(best).not.toBeNull()
    expect(best!.together.mlb).toBe(apps.reduce((sum, row) => sum + row.mlb, 0))
    expect(best!.together.count).toBe(apps.length)
    expect(best!.slot6Mlb).toBe(apps[0].mlb * 6)
  })
})
