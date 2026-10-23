import { Link } from 'react-router-dom'
import type { Servant } from '../types'
import { ServantIcon } from './ServantIcon'

export interface Tile {
  servant: Servant
  partial?: boolean
  sub?: string
  tip?: string
}

export function ServantGrid({
  items,
  onPick,
  pickedId,
}: {
  items: Tile[]
  onPick?: (servant: Servant) => void
  pickedId?: number
}) {
  if (!items.length) return <p className="empty">没有符合的从者。</p>
  return (
    <div className="svt-grid">
      {items.map((item) => {
        const title = [
          `No.${item.servant.no} ${item.servant.name}`,
          item.servant.cn ? '' : '日服未实装',
          item.partial ? '只在部分灵基或灵衣满足' : '',
          item.tip ?? '',
        ]
          .filter(Boolean)
          .join(' · ')
        const body = (
          <>
            <ServantIcon servant={item.servant} dim={item.partial} />
            <span className="svt-name">
              {item.servant.name}
              {item.partial ? '*' : ''}
            </span>
            <span className="svt-class">{item.servant.className}</span>
            {item.sub ? <span className="svt-sub">{item.sub}</span> : null}
          </>
        )
        if (onPick) {
          return (
            <button
              type="button"
              key={item.servant.id}
              className={pickedId === item.servant.id ? 'svt-tile on' : 'svt-tile'}
              data-no={item.servant.no}
              data-partial={item.partial ? '1' : '0'}
              title={title}
              onClick={() => onPick(item.servant)}
            >
              {body}
            </button>
          )
        }
        return (
          <Link
            key={item.servant.id}
            className="svt-tile"
            data-no={item.servant.no}
            data-partial={item.partial ? '1' : '0'}
            title={title}
            to={`/bond/servants?no=${item.servant.no}`}
          >
            {body}
          </Link>
        )
      })}
    </div>
  )
}
