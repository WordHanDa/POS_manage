import React, { useState, useEffect } from 'react';

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

  // 核心修正：處理時區並格式化時間
  const formatElapsedTime = (orderTimeStr) => {
    // 移除 Z 並手動解析，避免瀏覽器自動做時區轉換
    const datePart = orderTimeStr.replace('Z', '');
    const orderDate = new Date(datePart);
    
    // 計算與當前時間的秒數差
    const diffInSeconds = Math.floor((new Date().getTime() - orderDate.getTime()) / 1000);
    
    // 如果結果還是小於 0，代表伺服器時間與本地端不一致，強制歸零或顯示小額秒數
    const totalSeconds = diffInSeconds < 0 ? 0 : diffInSeconds;

    if (totalSeconds < 60) {
      return `${totalSeconds}秒`;
    } else {
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
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

  // 輪詢 API
  useEffect(() => {
    fetchRevenueDetails(selectedDate);
    const interval = setInterval(() => fetchRevenueDetails(selectedDate), 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // 驅動秒數跳動
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <header className="page-header">
        <h1>出菜清單</h1>
      </header>

      <div className="revenue-filter-card">
        <label className="filter-label">選擇日期：</label>
        <input 
          type="date" 
          className="date-picker-dark"
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)} 
        />
        <div className="pending-badge-text">
          待處理項目：<strong className="stats-badge-count">
            {orderDetails.filter(d => d.ITEM_SEND === 0).length}
          </strong>
        </div>
      </div>

      {loading && orderDetails.length === 0 ? (
        <div className="loading-container"><p>正在載入最新出餐順序...</p></div>
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
                const orderDate = new Date(item.ORDER_DATE.replace('Z', ''));
                const isUrgent = (now.getTime() - orderDate.getTime()) > 300000 && item.ITEM_SEND === 0;
                
                // 動態決定行類別
                let rowClass = "row-normal";
                if (item.ITEM_SEND === 1) rowClass = "row-done";
                else if (isUrgent) rowClass = "row-urgent";

                return (
                  <tr key={item.DETAIL_ID} className={rowClass}>
                    <td data-label="狀態/時間">
                      <div className="priority-box">
                        <span className="priority-rank">
                          {item.ITEM_SEND === 0 ? `P${index + 1}` : 'DONE'}
                        </span>
                        <span className={`timer-text ${isUrgent ? 'timer-urgent' : 'timer-normal'}`}>
                          {item.ITEM_SEND === 0 ? formatElapsedTime(item.ORDER_DATE) : '---'}
                        </span>
                      </div>
                    </td>
                    <td data-label="桌號">
                      <span className="type-badge seat-badge">{item.SEAT_NAME}</span>
                    </td>
                    <td data-label="品項">
                      <div className="item-name-bold">{item.ITEM_NAME}</div>
                      <div className="item-qty-tag">x {item.QUANTITY}</div>
                    </td>
                    <td data-label="備註" className="note-cell">
                      {item.ORDER_NOTE || '無備註'}
                    </td>
                    <td data-label="操作">
                      <button
                        className={`btn-primary btn-kitchen-action ${item.ITEM_SEND === 1 ? 'btn-kitchen-done' : 'btn-kitchen-send'}`}
                        disabled={item.ITEM_SEND === 1}
                        onClick={() => handleItemSend(item)}
                      >
                        {item.ITEM_SEND === 1 ? '已完成' : '確認出餐'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="5" className="empty-cell">目前沒有待處理項目</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default REVENUE;