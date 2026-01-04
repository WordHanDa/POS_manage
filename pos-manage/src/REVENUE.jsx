import React, { useState, useEffect } from 'react';
import './Management.css';

const REVENUE = ({API_BASE}) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRevenueDetails = async (date) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${date}`);
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleItemSend = async (item) => {
    if (!item) return;
    const confirmMsg = `確認出餐？\n[桌號]：${item.SEAT_NAME}\n[品項]：${item.ITEM_NAME} x ${item.QUANTITY}`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await fetch(`${API_BASE}/ORDER_DETAIL/send/${item.DETAIL_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendStatus: 1 })
      });
      fetchRevenueDetails(selectedDate);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRevenueDetails(selectedDate);
    const interval = setInterval(() => fetchRevenueDetails(selectedDate), 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <div className="container">
      <header><h1>出菜清單</h1></header>

      <div className="item-form" style={{ marginBottom: '20px', padding: '20px' }}>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <span style={{ marginLeft: '20px' }}>
          待處理項目：<strong>{orderDetails.filter(d => d.ITEM_SEND === 0).length}</strong>
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>正在載入最新出餐順序...</p>
        </div>
      ) : (
        <table className="item-table">
          <thead>
            <tr>
              <th>優先級/時間</th>
              <th>桌號</th>
              <th>品項內容</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orderDetails.length > 0 ? (
              orderDetails.map((item, index) => {
                const waitTime = Math.floor((new Date() - new Date(item.ORDER_DATE)) / 60000);
                const isUrgent = waitTime > 15 && item.ITEM_SEND === 0;

                return (
                  <tr
                    key={item.DETAIL_ID}
                    style={{
                      borderLeft: item.ITEM_SEND === 0 ? `5px solid ${isUrgent ? '#f5222d' : '#52c41a'}` : '5px solid #d9d9d9'
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 'bold', color: isUrgent ? '#f5222d' : '' }}>
                        {item.ITEM_SEND === 0 ? `P${index + 1}` : 'DONE'}
                      </div>
                      <small>{new Date(item.ORDER_DATE).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      <span className="type-badge">{item.SEAT_NAME}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{item.ITEM_NAME}</div>
                      <div style={{ color: '#f5222d' }}>x {item.QUANTITY}</div>
                    </td>
                    <td className="description-cell">{item.ORDER_NOTE || '-'}</td>
                    <td>
                      <button
                        className="btn-primary"
                        disabled={item.ITEM_SEND === 1}
                        style={{
                          backgroundColor: item.ITEM_SEND === 1 ? '#d9d9d9' : '#52c41a',
                          borderColor: 'transparent',
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
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  目前沒有待處理項目
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