import { NavLink, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <>
      <header className="site-header">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>FGO 工具</strong>
            <small>国服向 · 含日服数据</small>
          </span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'on' : '')}>
            首页
          </NavLink>
          <NavLink to="/bond" className={({ isActive }) => (isActive ? 'on' : '')}>
            羁绊礼装
          </NavLink>
          <NavLink to="/updates" className={({ isActive }) => (isActive ? 'on' : '')}>
            更新追踪
          </NavLink>
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  )
}
