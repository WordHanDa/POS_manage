import React, { useState, useEffect } from 'react';

const EVENT = ({ API_BASE }) => {
  // 設定預設日期為今日 (UTC+8)
  const getTodayUTC8 = () => {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const [selectedDate, setSelectedDate] = useState(getTodayUTC8());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  // 獲取事件列表
  const fetchEvents = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/EVENT?date=${date}`);
      if (!response.ok) throw new Error('網路回應不正確');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error("讀取失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  // 刪除事件邏輯
  const handleDelete = async (id) => {
    if (!window.confirm("確定要刪除此事件嗎？")) return;
    try {
      const response = await fetch(`${API_BASE}/EVENT`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EVENT_ID: id })
      });
      if (response.ok) fetchEvents(selectedDate);
      else alert("刪除失敗");
    } catch (err) {
      console.error("刪除請求出錯:", err);
    }
  };

  // 輪詢與計時驅動
  useEffect(() => {
    fetchEvents(selectedDate);
    const interval = setInterval(() => fetchEvents(selectedDate), 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <header className="page-header">
        <h1>事件管理</h1>
      </header>

      <div className="revenue-filter-card">
        <input 
          type="date" 
          className="date-picker-dark"
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
        <div className="pending-badge-text">
          共有事件：<strong className="stats-badge-count">{events.length}</strong> 項
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="loading-container"><p>載入中...</p></div>
      ) : (
        <table className="item-table">
          <thead>
            <tr>
              <th>開始日期</th>
              <th>結束日期</th>
              <th>事件內容</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {events.length > 0 ? (
              events.map((event) => {
                // 簡易邏輯：判斷事件是否已結束
                const isEnded = new Date(event.EVENT_END_DATE) < now;
                return (
                  <tr key={event.EVENT_ID} className={isEnded ? "row-done" : "row-normal"}>
                    <td data-label="開始日期">{event.EVENT_START_DATE}</td>
                    <td data-label="結束日期">{event.EVENT_END_DATE}</td>
                    <td data-label="內容">
                      <div className="item-name-bold">{event.EVENT_CONTANT}</div>
                    </td>
                    <td data-label="備註">{event.EVENT_NOTE || '-'}</td>
                    <td data-label="操作">
                      <button 
                        className="btn-primary btn-kitchen-action"
                        onClick={() => handleDelete(event.EVENT_ID)}
                      >
                        刪除
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="5" className="empty-cell">目前沒有事件資料</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EVENT;