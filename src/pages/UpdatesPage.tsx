import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export function UpdatesPage() {
  useEffect(() => {
    document.title = '国服更新追踪 · FGO 工具'
  }, [])
  return (
    <>
      <h1>国服更新追踪</h1>
      <p className="lede">
        这一页还没做。计划是对照日服图鉴，列出国服尚未实装的从者和礼装，方便看下次维护可能来什么。
      </p>
      <div className="panel">
        <p>现在能用的是羁绊加成礼装查询，数据里已经区分了国服已实装和日服未实装。</p>
        <p>
          <Link className="btn" to="/bond">
            去查羁绊礼装
          </Link>
        </p>
      </div>
    </>
  )
}
