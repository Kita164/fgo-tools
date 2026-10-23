import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { data } from '../lib/bond'

export function HomePage() {
  useEffect(() => {
    document.title = 'FGO 工具'
  }, [])
  const { meta } = data
  return (
    <>
      <h1>给国服玩家的 FGO 小工具</h1>
      <p className="lede">
        现在先做羁绊加成礼装：把几张「只给某一类从者加羁绊」的礼装放在一起，看谁能同时吃到，加成按张数相加是多少。从者收录到日服最新，国服还没有的会标成日服未实装。
      </p>
      <p className="meta-line">数据更新于 {meta.updated}（UTC）· 来源 Atlas Academy 日服 / 国服导出</p>
      <div className="stats">
        <div className="stat">
          <b>No.{meta.jpLatest.no}</b>
          <span>日服最新 · {meta.jpLatest.name}</span>
        </div>
        <div className="stat">
          <b>No.{meta.cnLatest.no}</b>
          <span>国服最新 · {meta.cnLatest.name}</span>
        </div>
        <div className="stat">
          <b>{meta.servantCount}</b>
          <span>收录从者 · 其中国服 {meta.cnServantCount}</span>
        </div>
        <div className="stat">
          <b>{meta.conditionalCeCount}</b>
          <span>有条件羁绊礼装 · 国服 {meta.cnCeCount}</span>
        </div>
      </div>
      <div className="tool-grid">
        <Link className="tool-card" to="/bond">
          <span className="kicker">可用</span>
          <h2>羁绊加成礼装组合查询</h2>
          <p>选择有从者条件的羁绊礼装和张数，查看同时满足全部条件的从者，以及只吃到其中一部分的人。</p>
          <span className="go">打开查询</span>
        </Link>
        <div className="tool-card disabled">
          <span className="kicker">即将推出</span>
          <h2>国服更新追踪</h2>
          <p>打算用来对照日服，看国服还缺哪些从者和礼装。这一页先占着位置。</p>
          <Link className="go" to="/updates">
            看说明
          </Link>
        </div>
      </div>
    </>
  )
}
