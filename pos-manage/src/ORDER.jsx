import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Management.css';

const ORDER = ({ API_BASE }) => {
  const [orders, setOrders] = useState([]);
  const [seats, setSeats] = useState([]);
  const [newOrder, setNewOrder] = useState({ seatId: '', mount: 0, note: '' });
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 取得 UTC+8 當天日期字串 (YYYY-MM-DD)
  const getTodayUTC8 = () => {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());
  };

  // 計算全店未結清總數
  const unSettleCount = orders.filter(o => o.SETTLE !== 1).length;

  // 1. 取得所有訂單並按 ID 分組
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const today = getTodayUTC8();
      const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${today}`);
      if (!response.ok) throw new Error('無法取得訂單資料');
      const data = await response.json();

      const groupedOrders = data.reduce((acc, current) => {
        const existingOrder = acc.find(o => o.ORDER_ID === current.ORDER_ID);
        if (existingOrder) {
          existingOrder.items.push({
            name: current.ITEM_NAME,
            qty: current.QUANTITY,
            price: current.PRICE_AT_SALE,
            note: current.ORDER_NOTE
          });
          existingOrder.ORDER_MOUNT += (current.PRICE_AT_SALE * current.QUANTITY);
        } else {
          acc.push({
            ...current,
            ORDER_MOUNT: current.PRICE_AT_SALE * current.QUANTITY,
            items: [{
              name: current.ITEM_NAME,
              qty: current.QUANTITY,
              price: current.PRICE_AT_SALE,
              note: current.ORDER_NOTE
            }]
          });
        }
        return acc;
      }, []);

      setOrders(groupedOrders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 取得座位即時狀態
  const fetchSeats = async () => {
    try {
      const response = await fetch(`${API_BASE}/SEAT_STATUS`);
      if (!response.ok) throw new Error('無法取得座位狀態');
      const data = await response.json();
      setSeats(data);
    } catch (err) {
      console.error("座位資訊讀取錯誤:", err);
    }
  };

  const refreshData = () => {
    fetchOrders();
    fetchSeats();
  };

  // 3. 提交表單 (新增/編輯)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = !!editingOrder;
    const url = isEditing ? `${API_BASE}/ORDER/${editingOrder.ORDER_ID}` : `${API_BASE}/ORDER`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = isEditing ? {
      seatId: parseInt(editingOrder.SEAT_ID),
      mount: parseFloat(editingOrder.ORDER_MOUNT),
      note: editingOrder.NOTE
    } : {
      seatId: parseInt(newOrder.seatId),
      mount: parseFloat(newOrder.mount || 0),
      note: newOrder.note
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('操作失敗');

      setNewOrder({ seatId: '', mount: 0, note: '' });
      setEditingOrder(null);
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  // 4. 結清訂單
  const settleOrder = async (id) => {
    if (!window.confirm('確定要結清此訂單嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/settle/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('結清失敗');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  // 5. 刪除訂單
  const deleteOrder = async (id) => {
    if (!window.confirm('確定要刪除此訂單嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('刪除失敗');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    refreshData();
    // 建議增加自動更新機制 (每 60 秒)
    const timer = setInterval(refreshData, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container">
      <header className="audit-header">
        <h1>訂單管理系統</h1>
        <div className="summary-cards">
          <div className="card">
            <h3>待結清筆數</h3>
            <p className="card-value" style={{ color: '#f5222d' }}>{unSettleCount} 筆</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-message" style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: '10px', borderRadius: '4px', color: '#ff4d4f', marginBottom: '20px' }}>
          <strong>錯誤：</strong> {error}
          <button onClick={() => { setError(null); refreshData(); }} style={{ marginLeft: '10px' }}>重試</button>
        </div>
      )}

      {/* 表單區塊 */}
      <div className="filter-panel" style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <h3 style={{ marginTop: 0 }}>{editingOrder ? `正在編輯訂單 #${editingOrder.ORDER_ID}` : '快速開單'}</h3>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>選擇座位：</label>
              <select
                style={{ width: '100%', padding: '10px' }}
                value={editingOrder ? editingOrder.SEAT_ID : newOrder.seatId}
                onChange={(e) => editingOrder
                  ? setEditingOrder({ ...editingOrder, SEAT_ID: e.target.value })
                  : setNewOrder({ ...newOrder, seatId: e.target.value })
                }
                required
              >
                <option value="">-- 選擇桌號 --</option>
                {seats.map(seat => (
                  <option key={seat.SEAT_ID} value={seat.SEAT_ID}>
                    {seat.SEAT_NAME} {seat.active_orders > 0 ? `(${seat.active_orders}單未結)` : '(空)'}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: '250px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>備註：</label>
              <input
                type="text"
                style={{ width: '100%', padding: '10px' }}
                value={editingOrder ? editingOrder.NOTE : newOrder.note}
                onChange={(e) => editingOrder
                  ? setEditingOrder({ ...editingOrder, NOTE: e.target.value })
                  : setNewOrder({ ...newOrder, note: e.target.value })
                }
                placeholder="例如：少冰、全糖"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '42px', padding: '0 30px' }}>
              {editingOrder ? '更新' : '開單'}
            </button>
            {editingOrder && <button type="button" onClick={() => setEditingOrder(null)} className="btn-secondary">取消</button>}
          </div>
        </form>
      </div>

      {/* 清單表格 */}
      <div style={{ marginTop: '30px' }}>
        {loading && orders.length === 0 ? <p>正在讀取資料庫...</p> : (
          <table className="item-table">
            <thead>
              <tr>
                <th>單號</th>
                <th>桌號</th>
                <th>狀態</th>
                <th>金額</th>
                <th>時間</th>
                <th>備註</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const isSettled = order.SETTLE === 1;
                return (
                  <tr key={order.ORDER_ID} style={{ backgroundColor: isSettled ? '#f5f5f5' : '#fff' }}>
                    <td>#{order.ORDER_ID}</td>
                    <td><span className="type-badge" style={{ backgroundColor: '#1890ff' }}>{order.SEAT_NAME}</span></td>
                    <td>
                      {isSettled ? (
                        <span style={{ color: '#8c8c8c' }}>● 已結清</span>
                      ) : (
                        <span style={{ color: order.ORDER_SEND === 1 ? '#52c41a' : '#f5222d', fontWeight: 'bold' }}>
                          {order.ORDER_SEND === 1 ? '● 已送餐' : '○ 準備中'}
                        </span>
                      )}
                    </td>
                    <td><strong style={{ color: '#333' }}>${Number(order.ORDER_MOUNT).toFixed(0)}</strong></td>
                    <td style={{ fontSize: '0.85em', color: '#666' }}>
                      {new Date(order.ORDER_DATE).toLocaleTimeString('zh-TW', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{order.NOTE || '-'}</td>
                    <td>
                      <Link to={`/ORDER/${order.ORDER_ID}`} className="btn-primary" style={{ textDecoration: 'none', padding: '5px 10px', fontSize: '0.9em' }}>明細</Link>
                      {!isSettled && (
                        <>
                          <button onClick={() => setEditingOrder(order)} className="btn-secondary" style={{ marginLeft: '5px' }}>改</button>
                          <button onClick={() => settleOrder(order.ORDER_ID)} className="btn-primary" style={{ marginLeft: '5px', backgroundColor: '#faad14', borderColor: '#faad14' }}>結</button>
                          {order.ORDER_SEND !== 1 && (
                            <button onClick={() => deleteOrder(order.ORDER_ID)} className="btn-delete" style={{ marginLeft: '10px' }}>刪除</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ORDER;