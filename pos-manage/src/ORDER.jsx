import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ORDER = ({ API_BASE }) => {
  const [orders, setOrders] = useState([]);
  const [seats, setSeats] = useState([]);
  // newOrder 增加 discount 欄位
  const [newOrder, setNewOrder] = useState({ seatId: '', mount: 0, note: '', discount: 0 });
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const unSettleCount = orders.filter(o => o.settle !== 1).length;

  // 1. 取得所有訂單並重新計算金額
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${new Date().toISOString().split('T')[0]}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();

      const groupedOrders = data.reduce((acc, current) => {
        const existingOrder = acc.find(o => o.ORDER_ID === current.ORDER_ID);
        const itemPrice = Number(current.PRICE_AT_SALE || 0);
        const itemQty = Number(current.QUANTITY || 0);
        const itemTotal = itemPrice * itemQty;
        const discountValue = Number(current.DISCOUNT || 0);

        if (existingOrder) {
          // 如果有品項細項才加入 (處理 LEFT JOIN 的 null 情況)
          if (current.DETAIL_ID) {
            existingOrder.items.push({
              name: current.ITEM_NAME,
              qty: itemQty,
              price: itemPrice,
              note: current.NOTE
            });
            existingOrder.subTotal += itemTotal;
          }
          // 重新計算最終應付金額
          existingOrder.ORDER_MOUNT = existingOrder.subTotal - existingOrder.DISCOUNT;
        } else {
          acc.push({
            ...current,
            DISCOUNT: discountValue,
            subTotal: itemTotal,
            ORDER_MOUNT: itemTotal - discountValue,
            items: current.DETAIL_ID ? [{
              name: current.ITEM_NAME,
              qty: itemQty,
              price: itemPrice,
              note: current.NOTE
            }] : []
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

  const refreshData = () => {
    fetchOrders();
    fetchSeats();
  };

  // 3. 提交表單 (包含 DISCOUNT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = !!editingOrder;
    const url = isEditing ? `${API_BASE}/ORDER/${editingOrder.ORDER_ID}` : `${API_BASE}/ORDER`;
    const method = isEditing ? 'PUT' : 'POST';

    const payload = isEditing ? {
      seatId: parseInt(editingOrder.SEAT_ID),
      mount: parseFloat(editingOrder.ORDER_MOUNT),
      note: editingOrder.NOTE,
      discount: parseFloat(editingOrder.DISCOUNT || 0) // 增加折扣傳送
    } : {
      seatId: parseInt(newOrder.seatId),
      mount: parseFloat(newOrder.mount || 0),
      note: newOrder.note,
      discount: parseFloat(newOrder.discount || 0) // 增加折扣傳送
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Operation failed');

      setNewOrder({ seatId: '', mount: 0, note: '', discount: 0 });
      setEditingOrder(null);
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const settleOrder = async (id) => {
    if (!window.confirm('確定要結清此訂單嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/settle/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Settle failed');
      alert('訂單已結清！');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('確定要刪除此訂單嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      refreshData();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="container">
      <header className="page-header">
        <h1>訂單管理 (ORDER)</h1>
      </header>

      <div className='context-info'>
        <strong>即時統計：</strong>
        目前店內有 <span className="stats-badge-count">{unSettleCount}</span> 筆訂單尚未結清。
      </div>

      {error && <div className="error-message-box">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="item-form admin-card">
        <h2>{editingOrder ? '編輯訂單內容' : '快速建立新訂單'}</h2>

        <div className="form-group">
          <label>選擇座位</label>
          <select
            className="form-select full-width-input"
            value={editingOrder ? editingOrder.SEAT_ID : newOrder.seatId}
            onChange={(e) => editingOrder
              ? setEditingOrder({ ...editingOrder, SEAT_ID: e.target.value })
              : setNewOrder({ ...newOrder, seatId: e.target.value })
            }
            required
          >
            <option value="">-- 請選擇座位 --</option>
            {seats.map(seat => (
              <option key={seat.SEAT_ID} value={seat.SEAT_ID}>
                {seat.SEAT_NAME} {seat.active_orders > 0 ? `(已有 ${seat.active_orders} 筆)` : '(空閒)'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>折扣金額 (DISCOUNT)</label>
          <input
            type="number"
            className="form-input full-width-input"
            value={editingOrder ? editingOrder.DISCOUNT : newOrder.discount}
            onChange={(e) => editingOrder
              ? setEditingOrder({ ...editingOrder, DISCOUNT: e.target.value })
              : setNewOrder({ ...newOrder, discount: e.target.value })
            }
            placeholder="0"
          />
        </div>

        <div className="form-group">
          <label>訂單備註</label>
          <textarea
            className="form-textarea"
            value={editingOrder ? editingOrder.NOTE : newOrder.note}
            onChange={(e) => editingOrder
              ? setEditingOrder({ ...editingOrder, NOTE: e.target.value })
              : setNewOrder({ ...newOrder, note: e.target.value })
            }
            placeholder="輸入備註..."
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            {editingOrder ? '儲存變更' : '建立訂單'}
          </button>
          {editingOrder && (
            <button type="button" onClick={() => setEditingOrder(null)} className="btn-secondary">取消</button>
          )}
        </div>
      </form>

      <h2 className="list-title">今日訂單清單</h2>
      {loading ? <p className="loading-text">載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>座位</th>
              <th>狀態</th>
              <th>小計</th>
              <th>折扣</th>
              <th>最終總額</th>
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
                  <td data-label="編號">{order.ORDER_ID}</td>
                  <td data-label="座位">
                    <span className="type-badge">{seatObj ? seatObj.SEAT_NAME : order.SEAT_ID}</span>
                  </td>
                  <td data-label="狀態">
                    <span className={`type-badge ${isSettled ? 'status-badge-settled' : 'status-badge-pending'}`}>
                      {isSettled ? '已結清' : '未結帳'}
                    </span>
                  </td>
                  <td data-label="小計" className="amount-subtotal">${Number(order.subTotal).toFixed(2)}</td>
                  <td data-label="折扣" className="amount-discount">-${Number(order.DISCOUNT).toFixed(2)}</td>
                  <td data-label="最終總額" className="amount-grand-total">${Number(order.ORDER_MOUNT).toFixed(2)}</td>
                  <td data-label="備註" className="description-cell">{order.NOTE || '-'}</td>
                  <td data-label="操作">
                    <Link to={`/ORDER/${order.ORDER_ID}`}>
                      <button className="btn-primary btn-action-sm">明細</button>
                    </Link>
                    {!isSettled && (
                      <>
                        <button onClick={() => setEditingOrder(order)} className="btn-secondary btn-action-sm">修改</button>
                        <button onClick={() => settleOrder(order.ORDER_ID)} className="btn-primary btn-settle btn-action-sm">結清</button>
                        <button onClick={() => deleteOrder(order.ORDER_ID)} className="btn-delete-link">刪除</button>
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
  );
};

export default ORDER;