import './App.css'
import { Routes, Route, HashRouter, Link } from 'react-router-dom'
import HOME from './Home.jsx'
import ITEM from './ITEM.jsx'
import SEAT from './SEAT.jsx'
import ORDER from './ORDER.jsx'

function App() {
  return (
    <HashRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 固定導覽列：添加 width: 100% 與 left: 0 */}
        <nav style={{ 
          padding: '15px 30px', 
          background: '#333', 
          display: 'flex', 
          gap: '20px', 
          alignItems: 'center',
          position: 'fixed',    // 使用 fixed 確保絕對固定
          top: 0,
          left: 0,
          width: '100%',        // 必須設定寬度
          zIndex: 1000,
          boxSizing: 'border-box' // 確保 padding 不會撐破寬度
        }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '20px' }}>
            系統首頁
          </Link>
          <Link to="/ITEM" style={{ color: '#ccc', textDecoration: 'none' }}>
            品項管理
          </Link>
          <Link to="/SEAT" style={{ color: '#ccc', textDecoration: 'none' }}>
            座位管理
          </Link>
          <Link to="/ORDER" style={{ color: '#ccc', textDecoration: 'none' }}>
            訂單管理
          </Link>
        </nav>

        {/* 內容區塊：因為 nav 是 fixed，所以這裡要加 paddingTop 避免內容被遮擋 */}
        <div style={{ paddingTop: '70px' }}> 
          <Routes>
            <Route path="/" element={<HOME />} />
            <Route path="/ITEM" element={<ITEM />} />
            <Route path="/SEAT" element={<SEAT />} />
            <Route path="/ORDER" element={<ORDER />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  )
}

export default App