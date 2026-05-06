import React, { useState, useEffect } from 'react';

const EVENT = ({ API_BASE }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    EVENT_START_DATE: '',
    EVENT_END_DATE: '',
    EVENT_CONTANT: '',
    EVENT_NOTE: ''
  });

  // 統一的資料獲取方法
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/EVENT`);
      if (!response.ok) throw new Error('伺服器回應錯誤');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("讀取事件失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [API_BASE]);

  // 新增事件
  const handleAddEvent = async (e) => {
  e.preventDefault();
  
  // 決定使用的方法與路徑
  const method = editingId ? 'PUT' : 'POST';
  // 如果是更新，通常需要把 ID 一併傳給後端
  const bodyData = editingId ? { ...formData, EVENT_ID: editingId } : formData;

  try {
    const response = await fetch(`${API_BASE}/EVENT`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });
    
    if (response.ok) {
      // 成功後清空表單並重置編輯狀態
      setFormData({ EVENT_START_DATE: '', EVENT_END_DATE: '', EVENT_CONTANT: '', EVENT_NOTE: '' });
      setEditingId(null);
      fetchEvents();
    } else {
      const result = await response.json();
      alert(`操作失敗: ${result.error || '未知錯誤'}`);
    }
  } catch (err) {
    console.error("請求異常:", err);
  }
};
  
  const handleEdit = (id) => {
  // 從現有的 events 陣列中找到該筆資料
  const eventToEdit = events.find((e) => e.EVENT_ID === id);
  if (eventToEdit) {
    setEditingId(id); // 設定正在編輯的 ID
    setFormData({
      EVENT_START_DATE: eventToEdit.EVENT_START_DATE,
      EVENT_END_DATE: eventToEdit.EVENT_END_DATE,
      EVENT_CONTANT: eventToEdit.EVENT_CONTANT,
      EVENT_NOTE: eventToEdit.EVENT_NOTE
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

  // 刪除事件
  const handleDelete = async (id) => {
    if (!window.confirm("確定要刪除此事件嗎？")) return;

    try {
      const response = await fetch(`${API_BASE}/EVENT`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EVENT_ID: id })
      });

      if (response.ok) {
        fetchEvents();
      } else {
        alert("刪除失敗");
      }
    } catch (err) {
      console.error("刪除請求出錯:", err);
    }
  };

  return (
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

          <div className="form-group">
            <label>注意事項</label>
            <input type="text" className="form-input" placeholder="事件注意事項" value={formData.EVENT_NOTE} onChange={e => setFormData({...formData, EVENT_NOTE: e.target.value})} />
          </div>
          
          <div className="button-group">
    <button type="submit" className="btn-primary">
      {editingId ? "更新事件" : "新增事件"}
    </button>
    {editingId && (
      <button type="button" className="btn-secondary" onClick={() => {
        setEditingId(null);
        setFormData({ EVENT_START_DATE: '', EVENT_END_DATE: '', EVENT_CONTANT: '', EVENT_NOTE: '' });
      }}>取消編輯</button>
    )}
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
                    <button onClick={() => handleEdit(event.EVENT_ID)} className="btn-edit">編輯</button>
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