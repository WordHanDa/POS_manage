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

  // 計算全店未結清總數 (顯示於統計區)
  const unSettleCount = orders.filter(o => o.settle !== 1).length;

  // 1. 取得所有訂單
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ORDER`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 取得座位即時狀態 (包含未結清筆數與金額)
  const fetchSeats = async () => {
    try {
      const response = await fetch(`${API_BASE}/SEAT_STATUS`);
      if (!response.ok) throw new Error('Failed to fetch seats');
      const data = await response.json();
      setSeats(data);
    } catch (err) {
      console.error("Error fetching seats:", err);
    }
  };

  // 核心邏輯：執行任何變動後，同時更新兩個資料來源
  const refreshData = () => {
    fetchOrders();
    fetchSeats();
  };

  // 3. 提交表單 (新增訂單或修改備註)
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
      if (!response.ok) throw new Error('Operation failed');

      setNewOrder({ seatId: '', mount: 0, note: '' });
      setEditingOrder(null);
      refreshData(); // 成功後立即同步更新
    } catch (err) {
      setError(err.message);
    }
  };

  // 4. 結清訂單功能 (含頁面確認)
  const settleOrder = async (id) => {
    if (!window.confirm('確定要結清此訂單嗎？結清後將無法更改內容。')) return;

    try {
      const response = await fetch(`${API_BASE}/ORDER/settle/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Settle failed');

      alert('訂單已結清！');
      refreshData(); // 成功後立即同步更新
    } catch (err) {
      setError(err.message);
    }
  };

  // 5. 刪除訂單
  const deleteOrder = async (id) => {
    if (!window.confirm('確定要刪除此訂單嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      refreshData(); // 成功後立即同步更新
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="container">
      <h1>訂單管理 (ORDER)</h1>

      {/* 統計摘要 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ffe58f', borderRadius: '8px' }}>
        <strong>📢 即時統計：</strong>
        目前店內有 <span style={{ color: '#f5222d', fontSize: '1.2em', fontWeight: 'bold' }}>{unSettleCount}</span> 筆訂單尚未結清。
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {/* 新增/編輯 表單 */}
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingOrder ? '編輯訂單備註' : '快速建立新訂單'}</h2>

        <div className="form-group">
          <label>選擇座位 (即時桌況):</label>
          <select
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
            value={editingOrder ? editingOrder.SEAT_ID : newOrder.seatId}
            onChange={(e) => editingOrder
              ? setEditingOrder({ ...editingOrder, SEAT_ID: e.target.value })
              : setNewOrder({ ...newOrder, seatId: e.target.value })
            }
            required
          >
            <option value="">-- 請選擇座位 --</option>
            {seats.map(seat => {
              const count = seat.active_orders || 0;
              const amount = Number(seat.current_total || 0).toFixed(0);
              const statusText = count > 0 ? `(已有 ${count} 筆未結) $${amount}` : '(空閒)';

              return (
                <option key={seat.SEAT_ID} value={seat.SEAT_ID}>
                  {seat.SEAT_NAME} {statusText}
                </option>
              );
            })}
          </select>
        </div>

        <div className="description-area" style={{ marginTop: '15px' }}>
          <div className="form-group">
            <label>備註:</label>
            <textarea
              value={editingOrder ? editingOrder.NOTE : newOrder.note}
              onChange={(e) => editingOrder
                ? setEditingOrder({ ...editingOrder, NOTE: e.target.value })
                : setNewOrder({ ...newOrder, note: e.target.value })
              }
              placeholder="輸入備註（如：少鹽、加辣...）"
            />
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            {editingOrder ? '儲存變更' : '建立空訂單'}
          </button>
          {editingOrder && (
            <button type="button" onClick={() => setEditingOrder(null)} className="btn-secondary">
              取消
            </button>
          )}
        </div>
      </form>

      {/* 訂單清單表格 */}
      <h2 style={{ marginTop: '30px' }}>訂單清單</h2>
      {loading ? <p>載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>座位</th>
              <th>狀態</th>
              <th>總金額</th>
              <th>日期</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const seatObj = seats.find(s => s.SEAT_ID === order.SEAT_ID);
              const isSettled = order.settle === 1;

              return (
                <tr key={order.ORDER_ID}>
                  <td>{order.ORDER_ID}</td>
                  <td>
                    <span className="type-badge">
                      {seatObj ? seatObj.SEAT_NAME : `ID: ${order.SEAT_ID}`}
                    </span>
                  </td>
                  <td>
                    {isSettled ? (
                      <span className="type-badge" style={{ backgroundColor: '#8c8c8c', color: 'white' }}>
                        已結清
                      </span>
                    ) : (
                      <span className="type-badge" style={{
                        backgroundColor: order.SEND === 1 ? '#52c41a' : '#f5222d',
                        color: 'white'
                      }}>
                        {order.SEND === 1 ? '全部完成' : '製作中'}
                      </span>
                    )}
                  </td>
                  <td><strong style={{ color: '#007bff' }}>${Number(order.ORDER_MOUNT).toFixed(2)}</strong></td>
                  <td style={{ fontSize: '0.85em' }}>{new Date(order.ORDER_DATE).toLocaleString()}</td>
                  <td className="description-cell">{order.NOTE || '-'}</td>
                  <td>
                    <Link to={`/ORDER/${order.ORDER_ID}`}>
                      <button className="btn-primary" style={{ padding: '4px 12px' }}>明細</button>
                    </Link>

                    {!isSettled && (
                      <>
                        <button onClick={() => setEditingOrder(order)} className="btn-secondary" style={{ padding: '4px 8px', marginLeft: '5px' }}>修改</button>
                        <button 
                          onClick={() => settleOrder(order.ORDER_ID)} 
                          className="btn-primary" 
                          style={{ padding: '4px 8px', marginLeft: '5px', backgroundColor: '#faad14', borderColor: '#faad14' }}
                        >
                          結清
                        </button>
                      </>
                    )}

                    {/* 未結清且未完成出單才顯示刪除 */}
                    {!isSettled && order.SEND !== 1 && (
                      <button onClick={() => deleteOrder(order.ORDER_ID)} className="btn-delete" style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px', color: 'red' }}>
                        刪除
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ORDER;