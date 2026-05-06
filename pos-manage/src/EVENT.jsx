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
    try {
      const response = await fetch(`${API_BASE}/EVENT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormData({ EVENT_START_DATE: '', EVENT_END_DATE: '', EVENT_CONTANT: '', EVENT_NOTE: '' });
        fetchEvents(); // 重新整理列表
      } else {
        alert("新增失敗");
      }
    } catch (err) {
      console.error("新增請求出錯:", err);
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
    <div className="container">
      <header className="page-header">
        <h1>事件管理</h1>
      </header>

      {/* 新增表單區塊 */}
      <form onSubmit={handleAddEvent} className="event-form">
        <input type="date" value={formData.EVENT_START_DATE} onChange={e => setFormData({...formData, EVENT_START_DATE: e.target.value})} required />
        <input type="text" placeholder="結束日期" value={formData.EVENT_END_DATE} onChange={e => setFormData({...formData, EVENT_END_DATE: e.target.value})} />
        <input type="text" placeholder="事件內容" value={formData.EVENT_CONTANT} onChange={e => setFormData({...formData, EVENT_CONTANT: e.target.value})} />
        <input type="text" placeholder="備註" value={formData.EVENT_NOTE} onChange={e => setFormData({...formData, EVENT_NOTE: e.target.value})} />
        <button type="submit" className="btn-primary">新增事件</button>
      </form>

      {/* 列表顯示區塊 */}
      {loading ? (
        <p>正在載入事件列表...</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>開始日期</th>
              <th>結束日期</th>
              <th>內容</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.EVENT_ID}>
                <td>{event.EVENT_START_DATE}</td>
                <td>{event.EVENT_END_DATE}</td>
                <td>{event.EVENT_CONTANT}</td>
                <td>{event.EVENT_NOTE}</td>
                <td>
                  <button onClick={() => handleDelete(event.EVENT_ID)} className="btn-danger">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EVENT;