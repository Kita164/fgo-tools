import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { BondLayout } from './pages/BondLayout'
import { ComboPage } from './pages/ComboPage'
import { GroupPage } from './pages/GroupPage'
import { HomePage } from './pages/HomePage'
import { ServantPage } from './pages/ServantPage'
import { UpdatesPage } from './pages/UpdatesPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="bond" element={<BondLayout />}>
            <Route index element={<ComboPage />} />
            <Route path="groups" element={<GroupPage />} />
            <Route path="servants" element={<ServantPage />} />
          </Route>
          <Route path="updates" element={<UpdatesPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
