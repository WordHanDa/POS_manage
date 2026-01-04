import React, { useState, useEffect } from 'react';
import './Management.css';

const REVENUE = ({ API_BASE }) => {
  const getTodayUTC8 = () => {
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  };

  const [selectedDate, setSelectedDate] = useState(getTodayUTC8());
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  // 新增：用於觸發畫面每秒重繪，讓秒數跳動
  const [now, setNow] = useState(new Date());

  const fetchRevenueDetails = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${date}`);
      if (!response.ok) throw new Error('網路回應不正確');
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      console.error("讀取失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  // 格式化經過時間的邏輯
  const formatElapsedTime = (orderTime) => {
    const diffInSeconds = Math.floor((now - new Date(orderTime)) / 1000);
    if (diffInSeconds < 0) return "0秒";
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒`;
    } else {
      const mins = Math.floor(diffInSeconds / 60);
      const secs = diffInSeconds % 60;
      // 補零邏輯，例如 01:05
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const handleItemSend = async (item) => {
    if (!item) return;
    const confirmMsg = `確認出餐？\n[桌號]：${item.SEAT_NAME}\n[品項]：${item.ITEM_NAME} x ${item.QUANTITY}`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch(`${API_BASE}/ORDER_DETAIL/send/${item.DETAIL_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendStatus: 1 })
      });

      if (response.ok) {
        fetchRevenueDetails(selectedDate);
      } else {
        alert("更新失敗，請稍後再試");
      }
    } catch (err) {
      console.error("出餐請求出錯:", err);
    }
  };

  // 每 30 秒抓取一次 API 資料
  useEffect(() => {
    fetchRevenueDetails(selectedDate);
    const apiInterval = setInterval(() => fetchRevenueDetails(selectedDate), 30000);
    return () => clearInterval(apiInterval);
  }, [selectedDate]);

  // 每 1 秒更新一次本地時間（驅動秒數顯示）
  useEffect(() => {
    const timerInterval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerInterval);
  }, []);

  return (
    <div className="container">
      <header>
        <h1>出菜清單</h1>
      </header>

      <div className="item-form" style={{ marginBottom: '20px', padding: '20px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>選擇日期：</label>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <span style={{ marginLeft: '20px' }}>
          待處理項目：<strong style={{ color: '#f5222d', fontSize: '1.2em' }}>
            {orderDetails.filter(d => d.ITEM_SEND === 0).length}
          </strong>
        </span>
      </div>

      {loading && orderDetails.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>正在載入最新出餐順序...</p>
        </div>
      ) : (
        <table className="item-table">
          <thead>
            <tr>
              <th>優先級/等待時間</th>
              <th>桌號</th>
              <th>品項內容</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.length > 0 ? (
              orderDetails.map((item, index) => {
                // 超過 5 分鐘標記為緊急
                const diffInSeconds = Math.floor((now - new Date(item.ORDER_DATE)) / 1000);
                const isUrgent = diffInSeconds > 300 && item.ITEM_SEND === 0;

                return (
                  <tr
                    key={item.DETAIL_ID}
                    style={{
                      borderLeft: item.ITEM_SEND === 0 
                        ? `6px solid ${isUrgent ? '#f5222d' : '#52c41a'}` 
                        : '6px solid #d9d9d9',
                      backgroundColor: isUrgent ? '#fff1f0' : 'transparent' // 緊急時底色淡紅
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 'bold', color: isUrgent ? '#f5222d' : '' }}>
                        {item.ITEM_SEND === 0 ? `P${index + 1}` : 'DONE'}
                      </div>
                      <div style={{ 
                        fontSize: '0.9em', 
                        color: isUrgent ? '#f5222d' : '#1890ff',
                        fontWeight: item.ITEM_SEND === 0 ? 'bold' : 'normal'
                      }}>
                        {item.ITEM_SEND === 0 ? formatElapsedTime(item.ORDER_DATE) : '---'}
                      </div>
                    </td>
                    <td>
                      <span className="type-badge" style={{ padding: '4px 8px', background: '#1890ff', color: '#fff', borderRadius: '4px' }}>
                        {item.SEAT_NAME}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{item.ITEM_NAME}</div>
                      <div style={{ color: '#f5222d', fontWeight: 'bold' }}>x {item.QUANTITY}</div>
                    </td>
                    <td className="description-cell" style={{ color: '#666', fontStyle: item.ORDER_NOTE ? 'normal' : 'italic' }}>
                      {item.ORDER_NOTE || '無備註'}
                    </td>
                    <td>
                      <button
                        className="btn-primary"
                        disabled={item.ITEM_SEND === 1}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          border: 'none',
                          fontWeight: 'bold',
                          backgroundColor: item.ITEM_SEND === 1 ? '#d9d9d9' : '#52c41a',
                          color: '#fff',
                          cursor: item.ITEM_SEND === 1 ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => handleItemSend(item)}
                      >
                        {item.ITEM_SEND === 1 ? '已完成' : '確認出餐'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                  今日目前沒有待處理的訂單項目
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default REVENUE;