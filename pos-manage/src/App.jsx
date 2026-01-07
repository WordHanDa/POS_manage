import { Routes, Route, HashRouter, Link } from 'react-router-dom'
import HOME from './Home.jsx'
import ITEM from './ITEM.jsx'
import SEAT from './SEAT.jsx'
import ORDER from './ORDER.jsx'
import ORDER_DETAIL from './ORDER_DETAIL.jsx'
import REVENUE from './REVENUE.jsx'
import AUDIT from './AUDIT.jsx'
import './Management.css';

const API_BASE = 'https://posserver-sigma.vercel.app';

function App() {
  return (
    <HashRouter>
      <div className="app-layout">
        <nav className="navbar">
          <Link to="/" className="nav-brand">系統首頁</Link>
          <Link to="/ITEM" className="nav-link">品項管理</Link>
          <Link to="/SEAT" className="nav-link">座位管理</Link>
          <Link to="/ORDER" className="nav-link">訂單管理</Link>
          <Link to="/REVENUE" className="nav-link">出餐順序</Link>
          <Link to="/AUDIT" className="nav-link">營業報表</Link>
        </nav>
        
        <div className="main-container"> 
          <Routes>
            <Route path="/" element={<HOME API_BASE={API_BASE} />} />
            <Route path="/ITEM" element={<ITEM API_BASE={API_BASE} />} />
            <Route path="/SEAT" element={<SEAT API_BASE={API_BASE} />} />
            <Route path="/ORDER" element={<ORDER API_BASE={API_BASE} />} />
            <Route path="/REVENUE" element={<REVENUE API_BASE={API_BASE} />} />
            <Route path="/ORDER/:orderId" element={<ORDER_DETAIL API_BASE={API_BASE} />} />
            <Route path="/AUDIT" element={<AUDIT API_BASE={API_BASE} />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}

export default App