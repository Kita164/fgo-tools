export interface Servant {
  id: number
  no: number
  name: string
  nameJp: string
  cn: boolean
  classId: string
  className: string
  rarity: number
  face: string
}

export interface CePart {
  groupId: string
  base: number
  mlb: number
  flat: boolean
  scope: 'party' | 'self'
  event: string
  notes: string[]
  support: [number, number] | null
  effect: string
}

export interface CraftEssence {
  id: number
  no: number
  name: string
  nameJp: string
  cn: boolean
  rarity: number
  obtain: string
  face: string
  text: string
  textFrom: 'cn' | 'jp' | 'translation'
  textJp: string
  parts: CePart[]
}

export interface GroupMember {
  id: number
  mask: number
}

export interface Group {
  id: string
  label: string
  ceIds: number[]
  members: GroupMember[]
}

export interface Meta {
  updated: string
  servantCount: number
  cnServantCount: number
  jpLatest: { no: number; name: string; id: number }
  cnLatest: { no: number; name: string; id: number }
  conditionalCeCount: number
  cnCeCount: number
  excludedCount: number
  excludedSample: string[]
  notes: string[]
}

export interface BondData {
  meta: Meta
  servants: Servant[]
  ces: CraftEssence[]
  groups: Group[]
}

export type Region = 'all' | 'cn' | 'jp'

export interface ServantQuery {
  classId: string
  region: Region
  text: string
}
