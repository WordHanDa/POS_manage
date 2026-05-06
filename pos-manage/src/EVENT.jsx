import React, { useState, useEffect } from 'react';

const EVENT = ({ API_BASE }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    EVENT_START_DATE: '',
    EVENT_END_DATE: '',
    EVENT_CONTANT: '',
    EVENT_NOTE: ''
  });

  // ... (fetchEvents, handleAddEvent, handleDelete 等邏輯保持不變)

  return (
    // 使用 .app-layout 作為最外層背景容器
    <div className="app-layout">
      {/* 這裡若有 navbar 元件可加入，若無則可省略 */}
      
      {/* 使用 .main-container 來處理內距與置中 */}
      <main className="main-container">
        <header>
          <h1>事件管理</h1>
        </header>

        {/* 使用 .card 類別來套用深色背景與邊框 */}
        <form onSubmit={handleAddEvent} className="card">
          <div className="form-grid">
            <div className="form-group">
              <label>開始日期</label>
              <input type="date" className="form-input" value={formData.EVENT_START_DATE} onChange={e => setFormData({...formData, EVENT_START_DATE: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>結束日期</label>
              <input type="date" className="form-input" value={formData.EVENT_END_DATE} onChange={e => setFormData({...formData, EVENT_END_DATE: e.target.value})} />
            </div>
          </div>
          
          <div className="form-group">
            <label>內容</label>
            <input type="text" className="form-input" placeholder="事件內容" value={formData.EVENT_CONTANT} onChange={e => setFormData({...formData, EVENT_CONTANT: e.target.value})} />
          </div>
          
          <div className="button-group">
            <button type="submit" className="btn-primary">新增事件</button>
          </div>
        </form>

        {/* 表格容器 */}
        {loading ? (
          <p style={{textAlign: 'center', color: 'var(--gold)'}}>載入中...</p>
        ) : (
          <table className="item-table">
            <thead>
              <tr>
                <th>開始日期</th>
                <th>結束日期</th>
                <th>內容</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.EVENT_ID}>
                  <td data-label="開始日期">{event.EVENT_START_DATE}</td>
                  <td data-label="結束日期">{event.EVENT_END_DATE}</td>
                  <td data-label="內容">{event.EVENT_CONTANT}</td>
                  <td data-label="操作" className="action-cell">
                    <button onClick={() => handleDelete(event.EVENT_ID)} className="btn-delete">刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
};

export default EVENT;