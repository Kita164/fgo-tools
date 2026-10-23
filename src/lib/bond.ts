import raw from '../data/bond.json'
import type { BondData, CraftEssence, Servant, ServantQuery } from '../types'

export const data = raw as unknown as BondData

export const servantById = new Map(data.servants.map((servant) => [servant.id, servant]))
export const ceById = new Map(data.ces.map((ce) => [ce.id, ce]))
export const groupById = new Map(data.groups.map((group) => [group.id, group]))

const masksByGroup = new Map<string, Map<number, number>>(
  data.groups.map((group) => [group.id, new Map(group.members.map((member) => [member.id, member.mask]))]),
)

const CLASS_ORDER = [
  'shielder',
  'saber',
  'archer',
  'lancer',
  'rider',
  'caster',
  'assassin',
  'berserker',
  'ruler',
  'avenger',
  'moonCancer',
  'alterEgo',
  'foreigner',
  'pretender',
  'beast',
  'beastEresh',
  'unBeastOlgaMarie',
  'grandSaber',
  'grandArcher',
  'grandLancer',
  'grandRider',
  'grandCaster',
  'grandAssassin',
  'grandBerserker',
]

export const cesNewest = [...data.ces].sort((a, b) => b.no - a.no)

export function classOptions(): { id: string; name: string }[] {
  const names = new Map<string, string>()
  for (const servant of data.servants) names.set(servant.classId, servant.className)
  return [...names.keys()]
    .sort((a, b) => {
      const ia = CLASS_ORDER.indexOf(a)
      const ib = CLASS_ORDER.indexOf(b)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
    .map((id) => ({ id, name: names.get(id) ?? id }))
}

export function matchServant(servant: Servant, query: ServantQuery): boolean {
  if (query.classId && servant.classId !== query.classId) return false
  if (query.region === 'cn' && !servant.cn) return false
  if (query.region === 'jp' && servant.cn) return false
  const text = query.text.trim().toLowerCase()
  if (!text) return true
  if (String(servant.no) === text) return true
  return servant.name.toLowerCase().includes(text) || servant.nameJp.toLowerCase().includes(text)
}

export function maskFor(groupId: string, servantId: number): number | undefined {
  return masksByGroup.get(groupId)?.get(servantId)
}

/** 同一礼装的各段条件都要满足。mask 为 -1 表示每个形态都可以，0 表示没有同一形态能同时吃到各段。 */
export function craftEssenceMask(ce: CraftEssence, servantId: number): number | undefined {
  let mask = -1
  for (const part of ce.parts) {
    const partMask = maskFor(part.groupId, servantId)
    if (partMask === undefined) return undefined
    mask &= partMask
  }
  return mask
}

export interface PartTotals {
  base: number
  mlb: number
  flatBase: number
  flatMlb: number
}

export function partTotals(ce: CraftEssence, copies: number): PartTotals {
  const totals = { base: 0, mlb: 0, flatBase: 0, flatMlb: 0 }
  for (const part of ce.parts) {
    if (part.flat) {
      totals.flatBase += part.base * copies
      totals.flatMlb += part.mlb * copies
    } else {
      totals.base += part.base * copies
      totals.mlb += part.mlb * copies
    }
  }
  return totals
}

export interface Pick {
  ceId: number
  copies: number
}

export interface Hit {
  servantId: number
  matched: number
  total: number
  mask: number
  base: number
  mlb: number
  flatBase: number
  flatMlb: number
  missed: number[]
  partial: boolean
}

export function evaluate(picks: Pick[]): { full: Hit[]; near: Hit[] } {
  const active = picks.filter((pick) => pick.copies > 0 && ceById.has(pick.ceId))
  const full: Hit[] = []
  const near: Hit[] = []
  if (!active.length) return { full, near }

  for (const servant of data.servants) {
    let matched = 0
    let mask = -1
    let base = 0
    let mlb = 0
    let flatBase = 0
    let flatMlb = 0
    const missed: number[] = []
    for (const pick of active) {
      const ce = ceById.get(pick.ceId)!
      const ceMask = craftEssenceMask(ce, servant.id)
      if (ceMask === undefined || ceMask === 0) {
        missed.push(ce.id)
        continue
      }
      matched += 1
      mask &= ceMask
      const totals = partTotals(ce, pick.copies)
      base += totals.base
      mlb += totals.mlb
      flatBase += totals.flatBase
      flatMlb += totals.flatMlb
    }
    if (!matched) continue
    const hit: Hit = {
      servantId: servant.id,
      matched,
      total: active.length,
      mask,
      base,
      mlb,
      flatBase,
      flatMlb,
      missed,
      partial: mask !== -1 && mask !== 0,
    }
    if (matched === active.length && mask !== 0) full.push(hit)
    else near.push(hit)
  }

  const byNo = (id: number) => servantById.get(id)?.no ?? 0
  full.sort((a, b) => Number(a.partial) - Number(b.partial) || byNo(a.servantId) - byNo(b.servantId))
  near.sort(
    (a, b) =>
      b.matched - a.matched ||
      b.mlb - a.mlb ||
      b.flatMlb - a.flatMlb ||
      byNo(a.servantId) - byNo(b.servantId),
  )
  return { full, near }
}

export function servantsForCe(ceId: number): { servant: Servant; mask: number; partial: boolean }[] {
  const ce = ceById.get(ceId)
  if (!ce) return []
  const rows = []
  for (const servant of data.servants) {
    const mask = craftEssenceMask(ce, servant.id)
    if (mask === undefined || mask === 0) continue
    rows.push({ servant, mask, partial: mask !== -1 })
  }
  return rows
}

export interface CeServantHit {
  servant: Servant
  partial: boolean
  base: number
  mlb: number
  flatBase: number
  flatMlb: number
}

/** Servants who qualify for every listed CE. Partial when any one of those matches is only some ascensions or costumes. */
export function servantsForCes(ceIds: number[]): CeServantHit[] {
  const ids = ceIds.filter((id) => ceById.has(id))
  if (!ids.length) return []
  const byCe = ids.map((id) => {
    const map = new Map<number, boolean>()
    for (const row of servantsForCe(id)) map.set(row.servant.id, row.partial)
    return map
  })
  const sum = ids
    .map((id) => partTotals(ceById.get(id)!, 1))
    .reduce(
      (acc, totals) => ({
        base: acc.base + totals.base,
        mlb: acc.mlb + totals.mlb,
        flatBase: acc.flatBase + totals.flatBase,
        flatMlb: acc.flatMlb + totals.flatMlb,
      }),
      { base: 0, mlb: 0, flatBase: 0, flatMlb: 0 },
    )
  const hits: CeServantHit[] = []
  for (const [servantId, firstPartial] of byCe[0]) {
    let partial = firstPartial
    let ok = true
    for (let index = 1; index < byCe.length; index += 1) {
      const rowPartial = byCe[index].get(servantId)
      if (rowPartial === undefined) {
        ok = false
        break
      }
      if (rowPartial) partial = true
    }
    if (!ok) continue
    hits.push({ servant: servantById.get(servantId)!, partial, ...sum })
  }
  hits.sort((a, b) => Number(a.partial) - Number(b.partial) || a.servant.no - b.servant.no)
  return hits
}

export interface Applicable {
  ce: CraftEssence
  mask: number
  partial: boolean
  base: number
  mlb: number
  flatBase: number
  flatMlb: number
}

export function applicableTo(servantId: number): Applicable[] {
  const rows: Applicable[] = []
  for (const ce of data.ces) {
    const mask = craftEssenceMask(ce, servantId)
    if (mask === undefined || mask === 0) continue
    const totals = partTotals(ce, 1)
    rows.push({ ce, mask, partial: mask !== -1, ...totals })
  }
  rows.sort((a, b) => b.mlb - a.mlb || b.flatMlb - a.flatMlb || b.ce.no - a.ce.no)
  return rows
}

export interface StackSummary {
  top: Applicable
  slot6Base: number
  slot6Mlb: number
  together: { base: number; mlb: number; flatBase: number; flatMlb: number; count: number; partial: boolean }
}

export function bestStack(apps: Applicable[]): StackSummary | null {
  if (!apps.length) return null
  const top = apps[0]
  let together = {
    base: 0,
    mlb: -1,
    flatBase: 0,
    flatMlb: -1,
    count: 0,
    partial: false,
  }
  const consider = (list: Applicable[], partial: boolean) => {
    const base = list.reduce((sum, row) => sum + row.base, 0)
    const mlb = list.reduce((sum, row) => sum + row.mlb, 0)
    const flatBase = list.reduce((sum, row) => sum + row.flatBase, 0)
    const flatMlb = list.reduce((sum, row) => sum + row.flatMlb, 0)
    if (mlb > together.mlb || (mlb === together.mlb && flatMlb > together.flatMlb)) {
      together = { base, mlb, flatBase, flatMlb, count: list.length, partial }
    }
  }
  consider(
    apps.filter((row) => row.mask === -1),
    false,
  )
  const bits = new Set<number>()
  for (const row of apps) {
    if (row.mask === -1) continue
    for (let bit = 0; bit < 31; bit += 1) {
      if (row.mask & (1 << bit)) bits.add(bit)
    }
  }
  for (const bit of bits) {
    const flag = 1 << bit
    const list = apps.filter((row) => row.mask === -1 || row.mask & flag)
    consider(
      list,
      list.some((row) => row.partial),
    )
  }
  if (together.mlb < 0) together = { base: 0, mlb: 0, flatBase: 0, flatMlb: 0, count: 0, partial: false }
  return {
    top,
    slot6Base: top.base * 6,
    slot6Mlb: top.mlb * 6,
    together,
  }
}

export function groupOf(ce: CraftEssence) {
  return groupById.get(ce.parts[0]?.groupId ?? '')
}

export function sameCondition(ce: CraftEssence): CraftEssence[] {
  const groupId = ce.parts[0]?.groupId
  if (!groupId) return []
  return data.ces.filter((other) => other.id !== ce.id && other.parts.some((part) => part.groupId === groupId))
}
