import { NavLink, Outlet } from 'react-router-dom'
import { data } from '../lib/bond'

export function BondLayout() {
  return (
    <>
      <nav className="subnav" aria-label="羁绊礼装">
        <NavLink to="/bond" end className={({ isActive }) => (isActive ? 'on' : '')}>
          组合查询
        </NavLink>
        <NavLink to="/bond/groups" className={({ isActive }) => (isActive ? 'on' : '')}>
          按礼装
        </NavLink>
        <NavLink to="/bond/servants" className={({ isActive }) => (isActive ? 'on' : '')}>
          按从者
        </NavLink>
      </nav>
      <Outlet />
      <p className="site-footer">
        数据更新于 {data.meta.updated} · 日服最新 No.{data.meta.jpLatest.no} {data.meta.jpLatest.name} · 国服最新 No.
        {data.meta.cnLatest.no} {data.meta.cnLatest.name}
        <br />
        从者头像来自 Atlas Academy。本站不隶属 TYPE-MOON。
      </p>
    </>
  )
}
