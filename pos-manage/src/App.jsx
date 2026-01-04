import './App.css'
import { Routes, Route, HashRouter, Link } from 'react-router-dom'
import HOME from './Home.jsx'
import ITEM from './ITEM.jsx'
import SEAT from './SEAT.jsx'
import ORDER from './ORDER.jsx'
import ORDER_DETAIL from './ORDER_DETAIL.jsx'
import REVENUE from './REVENUE.jsx'
import AUDIT from './AUDIT.jsx'
const API_BASE = import.meta.env.VITE_IP_ADDR || '/api';

function App() {
  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 固定導覽列 */}
        <nav style={{ 
          padding: '15px 30px', 
          background: '#333', 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1000,
          boxSizing: 'border-box'
        }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '20px' }}>系統首頁</Link>
          <Link to="/ITEM" style={{ color: '#ccc', textDecoration: 'none' }}>品項管理</Link>
          <Link to="/SEAT" style={{ color: '#ccc', textDecoration: 'none' }}>座位管理</Link>
          <Link to="/ORDER" style={{ color: '#ccc', textDecoration: 'none' }}>訂單管理</Link>
          <Link to="/REVENUE" style={{ color: '#ccc', textDecoration: 'none' }}>出餐順序</Link>
          <Link to="/AUDIT" style={{ color: '#ccc', textDecoration: 'none' }}>營業報表</Link>
        </nav>

        {/* 內容區塊 */}
        <div style={{ paddingTop: '70px' }}> 
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