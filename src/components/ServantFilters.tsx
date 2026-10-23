import type { Region } from '../types'
import { ClassFilter } from './ClassFilter'
import { RegionFilter } from './RegionFilter'
import { SearchBox } from './SearchBox'

export function ServantFilters({
  classes,
  classId,
  region,
  text,
  onClass,
  onRegion,
  onText,
}: {
  classes: { id: string; name: string }[]
  classId: string
  region: Region
  text: string
  onClass: (classId: string) => void
  onRegion: (region: Region) => void
  onText: (text: string) => void
}) {
  return (
    <div className="filters">
      <SearchBox value={text} onChange={onText} />
      <ClassFilter classes={classes} value={classId} onChange={onClass} />
      <RegionFilter value={region} onChange={onRegion} />
    </div>
  )
}
