import React from 'react';
import { Link } from 'react-router-dom';
import './Management.css'; 

const Home = () => {
  return (
    <div className="container">
      <div className="item-form" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1 style={{ marginBottom: '30px' }}>系統管理後台</h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          padding: '20px'
        }}>
          {/* 借用 item-form 的樣式來製作卡片 */}
          <div style={{ border: '1px solid #eee', padding: '30px', borderRadius: '8px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
            <h3>品項管理</h3>
            <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px' }}>
              新增、編輯或刪除菜單品項、價格與描述。
            </p>
            <Link to="/ITEM">
              <button className="btn-primary">進入管理</button>
            </Link>
          </div>

          <div style={{ border: '1px solid #eee', padding: '30px', borderRadius: '8px' }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🪑</div>
            <h3>座位管理</h3>
            <p style={{ color: '#666', fontSize: '0.9em', marginBottom: '20px' }}>
              管理餐廳桌號與座位配置。
            </p>
            <Link to="/SEAT">
              <button className="btn-primary">進入管理</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;