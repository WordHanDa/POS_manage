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

  // 統計：所有未結清的訂單總數
  const unSettleCount = orders.filter(o => o.settle !== 1).length;

  // 統計：每個座位目前有多少筆未結清訂單
  const seatUsageMap = orders.reduce((acc, order) => {
    if (order.settle !== 1) {
      acc[order.SEAT_ID] = (acc[order.SEAT_ID] || 0) + 1;
    }
    return acc;
  }, {});

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ORDER`);
      if (!response.ok) throw new Error('無法取得訂單數據');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async () => {
    try {
      const response = await fetch(`${API_BASE}/SEAT`);
      if (!response.ok) throw new Error('無法取得座位數據');
      const data = await response.json();
      setSeats(data);
    } catch (err) {
      console.error("Fetch seats error:", err);
    }
  };

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
      mount: 0,
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
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  // 結清功能
  const settleOrder = async (id) => {
    if (!window.confirm('確定要結清此訂單嗎？結清後將無法更改內容且不得刪除。')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/settle/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('結清失敗');
      alert('訂單已結清！');
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('確定要刪除此訂單嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('刪除失敗');
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSeats();
  }, []);

  return (
    <div className="container">
      <h1>訂單管理 (ORDER)</h1>

      {/* 頂部統計區 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ffe58f', borderRadius: '8px' }}>
        <strong>營運概況：</strong>
        目前全店共有 <span style={{ color: '#f5222d', fontSize: '1.2em', fontWeight: 'bold' }}>{unSettleCount}</span> 筆訂單尚未結清。
      </div>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {/* 座位選擇區 (取代下拉選單) */}
      <div className="seat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {seats.map(seat => {
          const count = seatUsageMap[seat.SEAT_ID] || 0;
          const isSelected = newOrder.seatId === seat.SEAT_ID.toString() || (editingOrder && editingOrder.SEAT_ID === seat.SEAT_ID);
          
          return (
            <div 
              key={seat.SEAT_ID}
              onClick={() => !editingOrder && setNewOrder({ ...newOrder, seatId: seat.SEAT_ID.toString() })}
              style={{
                padding: '10px',
                textAlign: 'center',
                borderRadius: '6px',
                cursor: editingOrder ? 'not-allowed' : 'pointer',
                opacity: editingOrder && !isSelected ? 0.5 : 1
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{seat.SEAT_NAME}</div>
              <div style={{ fontSize: '0.8em', color: count > 0 ? '#cf1322' : '#389e0d' }}>
                {count > 0 ? `未結: ${count}` : '空閒'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 新增/編輯 表單 */}
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingOrder ? `編輯訂單 #${editingOrder.ORDER_ID}` : '快速開單'}</h2>
        
        <div className="form-group">
          <label>已選座位 ID: {editingOrder ? editingOrder.SEAT_ID : (newOrder.seatId || '請點選上方座位')}</label>
        </div>

        <div className="form-group" style={{ marginTop: '10px' }}>
          <label>訂單備註:</label>
          <textarea
            value={editingOrder ? editingOrder.NOTE : newOrder.note}
            onChange={(e) => editingOrder 
              ? setEditingOrder({ ...editingOrder, NOTE: e.target.value })
              : setNewOrder({ ...newOrder, note: e.target.value })
            }
            placeholder="請輸入備註..."
          />
        </div>

        <div className="button-group" style={{ marginTop: '10px' }}>
          <button type="submit" className="btn-primary" disabled={!editingOrder && !newOrder.seatId}>
            {editingOrder ? '儲存變更' : '建立新訂單'}
          </button>
          {editingOrder && (
            <button type="button" onClick={() => setEditingOrder(null)} className="btn-secondary">取消</button>
          )}
        </div>
      </form>

      {/* 訂單列表 */}
      <h2 style={{ marginTop: '30px' }}>訂單清單</h2>
      {loading ? <p>載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>座位</th>
              <th>狀態</th>
              <th>金額</th>
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
                  <td><span className="type-badge">{seatObj ? seatObj.SEAT_NAME : order.SEAT_ID}</span></td>
                  <td>
                    {isSettled ? (
                      <span className="type-badge" style={{ backgroundColor: '#8c8c8c', color: 'white' }}>已結清</span>
                    ) : (
                      <span className="type-badge" style={{ backgroundColor: order.SEND === 1 ? '#52c41a' : '#f5222d', color: 'white' }}>
                        {order.SEND === 1 ? '全部完成' : '製作中'}
                      </span>
                    )}
                  </td>
                  <td><strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong></td>
                  <td className="description-cell">{order.NOTE || '-'}</td>
                  <td>
                    <Link to={`/ORDER/${order.ORDER_ID}`}>
                      <button className="btn-primary" style={{ padding: '4px 10px' }}>明細</button>
                    </Link>

                    {!isSettled && (
                      <>
                        <button onClick={() => setEditingOrder(order)} className="btn-secondary" style={{ marginLeft: '5px' }}>修改</button>
                        <button 
                          onClick={() => settleOrder(order.ORDER_ID)} 
                          className="btn-primary" 
                          style={{ marginLeft: '5px', backgroundColor: '#faad14', borderColor: '#faad14' }}
                        >
                          結清
                        </button>
                      </>
                    )}

                    {/* 只有未結清且未完成的訂單才顯示刪除按鈕 */}
                    {!isSettled && order.SEND !== 1 && (
                      <button onClick={() => deleteOrder(order.ORDER_ID)} className="btn-delete" style={{ marginLeft: '10px', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
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