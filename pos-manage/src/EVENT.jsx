import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EVENT = ({ API_BASE }) => {
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({
    EVENT_START_DATE: '',
    EVENT_END_DATE: '',
    EVENT_CONTANT: '',
    EVENT_NOTE: ''
  });

  // 讀取資料
  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/EVENT`);
      setEvents(res.data);
    } catch (err) {
      console.error("讀取失敗:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 新增事件
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/EVENT`, formData);
      setFormData({ EVENT_START_DATE: '', EVENT_END_DATE: '', EVENT_CONTANT: '', EVENT_NOTE: '' });
      fetchEvents(); // 重新整理列表
    } catch (err) {
      alert("新增失敗");
    }
  };

  // 刪除事件
  const handleDelete = async (id) => {
    if (!window.confirm("確定要刪除嗎？")) return;
    try {
      await axios.delete(`${API_BASE}/EVENT`, { data: { EVENT_ID: id } });
      fetchEvents();
    } catch (err) {
      alert("刪除失敗");
    }
  };

  return (
    <div className="container">
      <h1>事件管理</h1>

      {/* 新增表單 */}
      <form onSubmit={handleAdd} style={{ marginBottom: '20px' }}>
        <input type="date" value={formData.EVENT_START_DATE} onChange={e => setFormData({...formData, EVENT_START_DATE: e.target.value})} required />
        <input type="text" placeholder="結束日期" value={formData.EVENT_END_DATE} onChange={e => setFormData({...formData, EVENT_END_DATE: e.target.value})} />
        <input type="text" placeholder="內容" value={formData.EVENT_CONTANT} onChange={e => setFormData({...formData, EVENT_CONTANT: e.target.value})} />
        <input type="text" placeholder="備註" value={formData.EVENT_NOTE} onChange={e => setFormData({...formData, EVENT_NOTE: e.target.value})} />
        <button type="submit">新增事件</button>
      </form>

      {/* 資料列表 */}
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
          {events.map(ev => (
            <tr key={ev.EVENT_ID}>
              <td>{ev.EVENT_START_DATE}</td>
              <td>{ev.EVENT_END_DATE}</td>
              <td>{ev.EVENT_CONTANT}</td>
              <td>{ev.EVENT_NOTE}</td>
              <td>
                <button onClick={() => handleDelete(ev.EVENT_ID)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EVENT;