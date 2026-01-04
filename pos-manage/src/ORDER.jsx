import React, { useState, useEffect } from 'react';
import './Management.css'; 

const ORDER = () => {
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({ seatId: '', mount: '', note: '' });
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:3002';

  // 1. 取得所有訂單
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ORDER`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 新增/更新訂單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = !!editingOrder;
    const url = isEditing ? `${API_BASE}/ORDER/${editingOrder.ORDER_ID}` : `${API_BASE}/ORDER`;
    const method = isEditing ? 'PUT' : 'POST';
    
    const payload = isEditing ? {
      seatId: editingOrder.SEAT_ID,
      mount: parseFloat(editingOrder.ORDER_MOUNT),
      note: editingOrder.NOTE
    } : {
      seatId: parseInt(newOrder.seatId),
      mount: parseFloat(newOrder.mount),
      note: newOrder.note
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Operation failed');
      
      setNewOrder({ seatId: '', mount: '', note: '' });
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  // 3. 刪除訂單
  const deleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const response = await fetch(`${API_BASE}/ORDER/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      fetchOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="container">
      <h1>ORDER Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingOrder ? 'Edit Order' : 'Add New Order'}</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>Seat ID:</label>
            <input
              type="number"
              value={editingOrder ? editingOrder.SEAT_ID : newOrder.seatId}
              onChange={(e) => editingOrder 
                ? setEditingOrder({ ...editingOrder, SEAT_ID: e.target.value })
                : setNewOrder({ ...newOrder, seatId: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Amount ($):</label>
            <input
              type="number"
              step="0.01"
              value={editingOrder ? editingOrder.ORDER_MOUNT : newOrder.mount}
              onChange={(e) => editingOrder 
                ? setEditingOrder({ ...editingOrder, ORDER_MOUNT: e.target.value })
                : setNewOrder({ ...newOrder, mount: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="description-area">
          <label>Note:</label>
          <textarea
            value={editingOrder ? editingOrder.NOTE : newOrder.note}
            onChange={(e) => editingOrder 
              ? setEditingOrder({ ...editingOrder, NOTE: e.target.value })
              : setNewOrder({ ...newOrder, note: e.target.value })
            }
          />
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            {editingOrder ? 'Update' : 'Create'} Order
          </button>
          {editingOrder && (
            <button type="button" onClick={() => setEditingOrder(null)} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Orders List */}
      <h2>Order List</h2>
      {loading ? <p>Loading...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Seat</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Note</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.ORDER_ID}>
                <td>{order.ORDER_ID}</td>
                <td><span className="type-badge">Seat {order.SEAT_ID}</span></td>
                <td><strong>${order.ORDER_MOUNT}</strong></td>
                <td style={{ fontSize: '0.85em' }}>{new Date(order.ORDER_DATE).toLocaleString()}</td>
                <td className="description-cell">{order.NOTE}</td>
                <td>
                  <button onClick={() => setEditingOrder(order)} className="btn-primary" style={{ padding: '4px 8px' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteOrder(order.ORDER_ID)} className="btn-delete" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ORDER;