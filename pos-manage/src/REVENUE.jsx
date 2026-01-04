import React, { useState, useEffect } from 'react';
import './Management.css';

const REVENUE = ({ API_BASE }) => {
  // 取得 UTC+8 的當前日期字串 (YYYY-MM-DD)
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
  // 新增：用於驅動畫面每秒更新的時間狀態
  const [now, setNow] = useState(new Date());

  // 取得資料邏輯
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

  // 格式化經過時間邏輯
  const formatElapsedTime = (orderTime) => {
    const orderDate = new Date(orderTime);
    // 計算毫秒差並轉為總秒數
    const diffInSeconds = Math.floor((now.getTime() - orderDate.getTime()) / 1000);
    
    // 避免因為伺服器/客戶端時間微小差距導致負數
    const totalSeconds = diffInSeconds < 0 ? 0 : diffInSeconds;

    if (totalSeconds < 60) {
      return `${totalSeconds}秒`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      // 顯示格式為 分:秒，秒數不滿10位補0
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // 處理出餐動作
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

  // 自動輪詢 API：當日期改變或每 30 秒執行一次
  useEffect(() => {
    fetchRevenueDetails(selectedDate);
    const interval = setInterval(() => fetchRevenueDetails(selectedDate), 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // 每秒更新一次本地時間，讓計時器「動起來」
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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
                const diffInSeconds = Math.floor((now.getTime() - new Date(item.ORDER_DATE).getTime()) / 1000);
                // 超過 5 分鐘 (300秒) 標記為緊急
                const isUrgent = diffInSeconds > 300 && item.ITEM_SEND === 0;

                return (
                  <tr
                    key={item.DETAIL_ID}
                    style={{
                      borderLeft: item.ITEM_SEND === 0 
                        ? `6px solid ${isUrgent ? '#f5222d' : '#52c41a'}` 
                        : '6px solid #d9d9d9',
                      backgroundColor: isUrgent ? '#fff1f0' : 'transparent'
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 'bold', color: isUrgent ? '#f5222d' : '#fff' }}>
                        {item.ITEM_SEND === 0 ? `P${index + 1}` : 'DONE'}
                      </div>
                      <div style={{ 
                        fontSize: '0.95em', 
                        fontFamily: 'monospace',
                        color: isUrgent ? '#f5222d' : '#40a9ff',
                        fontWeight: 'bold'
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
                    <td className="description-cell" style={{ color: '#999', fontStyle: item.ORDER_NOTE ? 'normal' : 'italic' }}>
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
                          backgroundColor: item.ITEM_SEND === 1 ? '#434343' : '#52c41a',
                          color: item.ITEM_SEND === 1 ? '#8c8c8c' : '#fff',
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
                  目前沒有待處理的項目
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