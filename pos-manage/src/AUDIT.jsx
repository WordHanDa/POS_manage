import React, { useState, useEffect, useMemo } from 'react';
import './Management.css';

const AUDIT = ({ API_BASE }) => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. 預設日期設為 UTC+8 當天
  const getTodayUTC8 = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());

  const [startDate, setStartDate] = useState(getTodayUTC8());
  const [endDate, setEndDate] = useState(getTodayUTC8());
  const [sortConfig, setSortConfig] = useState({ key: 'ORDER_ID', direction: 'desc' });

  const fetchOrders = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE}/ORDER`);
    if (!response.ok) throw new Error('無法取得訂單資料');
    const data = await response.json();
    setOrders(data);
  } catch (err) {
    console.error(err.message); // 只記錄在控制台，不使用 state
  } finally {
    setLoading(false);
  }
};

  const toggleExpand = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    setOrderDetails([]);
    try {
      const response = await fetch(`${API_BASE}/ORDER_DETAIL/${orderId}`);
      if (!response.ok) throw new Error('無法載入明細');
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      console.error("載入明細失敗", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 核心邏輯修正：篩選 SETTLE === 1 且符合日期範圍 ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 結帳狀態過濾：假設欄位名為 SETTLE (若您的 API 欄位不同請修改此處)
      // 這裡檢查 order.SETTLE === 1，若無此欄位則預設顯示所有已送單(ORDER_SEND === 1)
      const isSettled = order.SETTLE === 1 || order.ORDER_SEND === 1;

      const orderDate = new Date(order.ORDER_DATE);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      // 設定結束時間為當天的 23:59:59
      const endLimit = end ? new Date(end).setHours(23, 59, 59, 999) : null;
      const startLimit = start ? new Date(start).setHours(0, 0, 0, 0) : null;

      return isSettled &&
        (!startLimit || orderDate >= startLimit) &&
        (!endLimit || orderDate <= endLimit);
    });
  }, [orders, startDate, endDate]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (parseFloat(o.ORDER_MOUNT) || 0), 0);
  }, [filteredOrders]);

  return (
    <div className="container audit-container">
      <header className="audit-header">
        <h1>會計稽核管理 (已結帳訂單)</h1>
        <div className="summary-cards">
          <div className="card">
            <h3>結帳總筆數</h3>
            <p className="card-value">{filteredOrders.length} 筆</p>
          </div>
          <div className="card" style={{ borderTopColor: '#52c41a' }}>
            <h3>區間實收營收 (UTC+8)</h3>
            <p className="card-value">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
          </div>
        </div>
      </header>

      <div className="filter-panel" style={{ background: '#fff', padding: '15px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="filter-group">
          <label>查詢日期：</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span style={{ margin: '0 10px' }}>至</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-primary" style={{ marginLeft: '15px' }} onClick={fetchOrders}>重新整理</button>
          {(startDate || endDate) && (
            <button className="btn-clear" style={{ marginLeft: '10px' }} onClick={() => { setStartDate(getTodayUTC8()); setEndDate(getTodayUTC8()); }}>回到今日</button>
          )}
        </div>
      </div>
      {error && (
        <div style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          color: '#ff4d4f',
          borderRadius: '4px'
        }}>
          <strong>讀取發生錯誤：</strong> {error}
          <button
            onClick={() => { setError(null); fetchOrders(); }}
            style={{ marginLeft: '10px', cursor: 'pointer' }}
          >
            重試
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>讀取中...</div>
      ) : (
        <table className="item-table">
          <thead>
            <tr>
              <th onClick={() => setSortConfig({ key: 'ORDER_ID', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                單號 {sortConfig.key === 'ORDER_ID' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th>桌號</th>
              <th>成交時間 (UTC+8)</th>
              <th onClick={() => setSortConfig({ key: 'ORDER_MOUNT', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                金額 {sortConfig.key === 'ORDER_MOUNT' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? sortedOrders.map(order => (
              <React.Fragment key={order.ORDER_ID}>
                <tr>
                  <td>#{order.ORDER_ID}</td>
                  <td><span className="type-badge">{order.SEAT_NAME}</span></td>
                  <td>{new Date(order.ORDER_DATE).toLocaleString('zh-TW', { hour12: false })}</td>
                  <td className="price-cell"><strong>${Number(order.ORDER_MOUNT || 0).toFixed(0)}</strong></td>
                  <td>
                    <span style={{ color: '#52c41a', fontWeight: 'bold' }}>● 已結帳</span>
                  </td>
                  <td>
                    <button className="btn-secondary" onClick={() => toggleExpand(order.ORDER_ID)}>
                      {expandedOrder === order.ORDER_ID ? '收合' : '明細'}
                    </button>
                  </td>
                </tr>

                {expandedOrder === order.ORDER_ID && (
                  <tr className="detail-row">
                    <td colSpan="6" style={{ backgroundColor: '#fafafa', padding: '15px' }}>
                      <div className="audit-detail-card" style={{ border: '1px solid #eee', background: '#fff' }}>
                        <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                          <strong>明細單號 #{order.ORDER_ID}</strong>
                          <span>備註: {order.ORDER_NOTE || '無'}</span>
                        </div>
                        <table style={{ width: '100%', padding: '10px' }}>
                          <thead>
                            <tr style={{ color: '#888', fontSize: '0.9em' }}>
                              <th>品項</th>
                              <th>單價</th>
                              <th>數量</th>
                              <th>小計</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderDetails.map(d => (
                              <tr key={d.DETAIL_ID}>
                                <td>{d.ITEM_NAME}</td>
                                <td>${d.PRICE_AT_SALE}</td>
                                <td>x {d.QUANTITY}</td>
                                <td>${d.PRICE_AT_SALE * d.QUANTITY}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>此區間無已結帳紀錄</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AUDIT;