import { Routes, Route, HashRouter, Link } from 'react-router-dom'
import { useState } from 'react';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false); // 2. 控制選單狀態

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false); // 點擊連結後自動關閉

  const menuItems = [
    { to: "/", label: "系統首頁" },
    { to: "/ITEM", label: "品項管理" },
    { to: "/SEAT", label: "座位管理" },
    { to: "/ORDER", label: "訂單管理" },
    { to: "/REVENUE", label: "出餐順序" },
    { to: "/AUDIT", label: "營業報表" },
  ];

  return (
    <HashRouter>
      <div className="app-layout">
        <nav className="navbar">
          {/* 漢堡按鈕 */}
          <button className={`menu-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>

          {/* 背景遮罩 (背景漸黑效果) */}
          <div className={`menu-overlay ${isMenuOpen ? 'show' : ''}`} onClick={closeMenu}></div>

          {/* 側邊滑出選單 */}
          <div className={`nav-links-sidebar ${isMenuOpen ? 'open' : ''}`}>
            {menuItems.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                className="nav-link-side"
                onClick={closeMenu}
                style={{
                  // 根據索引計算延遲，達成逐一由上往下淡入
                  transitionDelay: isMenuOpen ? `${index * 0.1}s` : '0s'
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
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