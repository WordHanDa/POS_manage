import React, { useState, useEffect, useMemo } from 'react';
import './Management.css';

const AUDIT = ({API_BASE}) => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 篩選與排序狀態
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ORDER_ID', direction: 'desc' });


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ORDER`);
      if (!response.ok) throw new Error('無法取得訂單資料');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
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

  // --- 核心邏輯：根據您的資料庫欄位 (ORDER_DATE) 篩選 ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.ORDER_DATE);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      return (!start || orderDate >= start) && (!end || orderDate <= end);
    });
  }, [orders, startDate, endDate]);

  // --- 排序邏輯：對應 ORDER_ID, ORDER_MOUNT ---
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // 使用 ORDER_MOUNT 計算總營收
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (parseFloat(o.ORDER_MOUNT) || 0), 0);
  }, [filteredOrders]);

  return (
    <div className="container audit-container">
      <header className="audit-header">
        <h1>會計稽核管理 (Order Audit)</h1>
        <div className="summary-cards">
          <div className="card">
            <h3>篩選訂單數</h3>
            <p className="card-value">{filteredOrders.length} 筆</p>
          </div>
          <div className="card" style={{ borderTopColor: '#52c41a' }}>
            <h3>區間總營收</h3>
            {/* 根據 ORDER_MOUNT 彙整 */}
            <p className="card-value">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </header>

      {error && <div className="error-message">⚠️ 錯誤：{error}</div>}

      <div className="filter-panel">
        <div className="filter-group">
          <label>交易日期範圍：</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>至</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {(startDate || endDate) && (
            <button className="btn-clear" onClick={() => { setStartDate(''); setEndDate(''); }}>重置日期</button>
          )}
        </div>
      </div>

      {loading ? <p>正在讀取資料庫...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th onClick={() => setSortConfig({
                key: 'ORDER_ID',
                direction: sortConfig.key === 'ORDER_ID' && sortConfig.direction === 'asc' ? 'desc' : 'asc'
              })} style={{ cursor: 'pointer' }}>
                訂單編號 {sortConfig.key === 'ORDER_ID' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th>桌號</th>
              <th onClick={() => setSortConfig({
                key: 'ORDER_DATE',
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
              })} style={{ cursor: 'pointer' }}>
                成交時間 {sortConfig.key === 'ORDER_DATE' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th onClick={() => setSortConfig({
                key: 'ORDER_MOUNT',
                direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
              })} style={{ cursor: 'pointer' }}>
                訂單金額 {sortConfig.key === 'ORDER_MOUNT' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? sortedOrders.map(order => (
              <React.Fragment key={order.ORDER_ID}>
                <tr className={expandedOrder === order.ORDER_ID ? 'expanded-row' : ''}>
                  <td>#{order.ORDER_ID}</td>
                  <td>{order.SEAT_NAME} 號桌</td>
                  <td>{new Date(order.ORDER_DATE).toLocaleString()}</td>
                  <td className="price-cell"><strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong></td>
                  <td>{order.NOTE || '-'}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => toggleExpand(order.ORDER_ID)}>
                      {expandedOrder === order.ORDER_ID ? '收合' : '明細'}
                    </button>
                  </td>
                </tr>

                {expandedOrder === order.ORDER_ID && (
                  <tr className="detail-row">
                    <td colSpan="6" className="detail-container-cell">
                      <div className="audit-detail-card">
                        <div className="detail-header">
                          <h4>訂單明細內容 - 單號 #{order.ORDER_ID}</h4>
                          <span className="detail-info-badge">桌號: {order.SEAT_ID}</span>
                        </div>

                        {orderDetails.length > 0 ? (
                          <div className="detail-body">
                            {/* 改用 Grid 或 Flex 佈局的清單，比表格更清晰 */}
                            <div className="detail-list-header">
                              <span>品項</span>
                              <span>單價</span>
                              <span>數量</span>
                              <span>折扣</span>
                              <span>小計</span>
                            </div>
                            {orderDetails.map(d => (
                              <div className="detail-item-row" key={d.DETAIL_ID}>
                                <span className="item-name">{d.ITEM_NAME}</span>
                                <span className="item-price">${Number(d.PRICE_AT_SALE).toFixed(0)}</span>
                                <span className="item-qty">x {d.QUANTITY}</span>
                                <span className="item-discount">{d.SALE_IN_PERCENT}%</span>
                                <span className="item-subtotal">
                                  ${(d.PRICE_AT_SALE * d.QUANTITY * (d.SALE_IN_PERCENT / 100)).toFixed(2)}
                                </span>
                              </div>
                            ))}

                            <div className="detail-footer">
                              <div className="footer-notes">
                                <strong>備註:</strong> {order.NOTE || '無備註'}
                              </div>
                              <div className="footer-total">
                                <span>訂單總額:</span>
                                <strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="loading-spinner">載入中...</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>目前沒有相符的交易記錄</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AUDIT;