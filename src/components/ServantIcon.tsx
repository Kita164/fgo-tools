import { useState } from 'react'
import type { Servant } from '../types'

export function Portrait({
  src,
  name,
  rarity,
  size = 56,
  dim = false,
  badge,
}: {
  src: string
  name: string
  rarity: number
  size?: number
  dim?: boolean
  badge?: string
}) {
  const [bad, setBad] = useState(false)
  return (
    <span className={`face rarity-${rarity}${dim ? ' dim' : ''}`} style={{ width: size, height: size }}>
      {bad ? (
        <span className="face-fallback">{name.slice(0, 2)}</span>
      ) : (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setBad(true)}
        />
      )}
      {badge ? <span className="face-badge">{badge}</span> : null}
    </span>
  )
}

export function ServantIcon({
  servant,
  size = 60,
  dim = false,
}: {
  servant: Servant
  size?: number
  dim?: boolean
}) {
  return (
    <Portrait
      src={servant.face}
      name={servant.name}
      rarity={servant.rarity}
      size={size}
      dim={dim}
      badge={servant.cn ? undefined : '日'}
    />
  )
}
