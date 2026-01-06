import React, { useState, useEffect, useMemo } from 'react';
import './Management.css';

const AUDIT = ({ API_BASE }) => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 篩選與排序狀態
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ORDER_ID', direction: 'desc' });

  // 1. 取得所有訂單 (後端 API: /ORDER 已包含 DISCOUNT 欄位)
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 加上 ?t=... 參數，確保每次都是跟伺服器拿最新資料
      const response = await fetch(`${API_BASE}/ORDER?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('無法取得訂單資料');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 展開明細
  const toggleExpand = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    setOrderDetails([]); // 先清空舊明細，顯示載入中
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

  // --- 篩選邏輯 ---
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.ORDER_DATE);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      return (!start || orderDate >= start) && (!end || orderDate <= end);
    });
  }, [orders, startDate, endDate]);

  // --- 排序邏輯 ---
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // --- 營收總結計算 ---
  const stats = useMemo(() => {
    return filteredOrders.reduce((acc, o) => {
      // 累加訂單最終收到的錢
      acc.totalRevenue += parseFloat(o.ORDER_MOUNT || 0);
      // 累加折扣出去的錢 (用於稽核成本)
      acc.totalDiscount += parseFloat(o.DISCOUNT || 0);
      return acc;
    }, { totalRevenue: 0, totalDiscount: 0 });
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
            <p className="card-value">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="card" style={{ borderTopColor: '#f5222d' }}>
            <h3>已折讓總額</h3>
            <p className="card-value" style={{ color: '#cf1322' }}>-${stats.totalDiscount.toLocaleString()}</p>
          </div>
        </div>
      </header>

      {error && <div className="error-message" style={{ color: 'red' }}>錯誤：{error}</div>}

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
              <th>應付總額</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? sortedOrders.map(order => (
              <React.Fragment key={order.ORDER_ID}>
                <tr className={expandedOrder === order.ORDER_ID ? 'expanded-row' : ''}>
                  <td>#{order.ORDER_ID}</td>
                  <td><span className="type-badge">{order.SEAT_NAME || `桌號:${order.SEAT_ID}`}</span></td>
                  <td style={{ fontSize: '0.9em' }}>{new Date(order.ORDER_DATE).toLocaleString()}</td>
                  <td className="price-cell">
                    <strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong>
                    {order.DISCOUNT > 0 && <small style={{ color: 'red', display: 'block', fontSize: '0.7em' }}>(已扣折扣 ${order.DISCOUNT})</small>}
                  </td>
                  <td>
                    <button className="btn-secondary" onClick={() => toggleExpand(order.ORDER_ID)}>
                      {expandedOrder === order.ORDER_ID ? '收合內容' : '查看明細'}
                    </button>
                  </td>
                </tr>

                {expandedOrder === order.ORDER_ID && (
                  <tr className="detail-row">
                    <td colSpan="5" className="detail-container-cell">
                      <div className="audit-detail-card" style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                        <div className="detail-header" style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0 }}>單號 #{order.ORDER_ID} 詳細品項</h4>
                          <span style={{ fontSize: '0.9em', color: '#666' }}>結帳狀態：{order.settle === 1 ? '✅ 已結清' : '❌ 未結清'}</span>
                        </div>

                        {orderDetails.length > 0 ? (
                          <div className="detail-body">
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                              <thead style={{ background: '#eee', fontSize: '0.85em' }}>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '8px' }}>品項名稱</th>
                                  <th>單價</th>
                                  <th>數量</th>
                                  <th>小計</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orderDetails.map(d => (
                                  <tr key={d.DETAIL_ID} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{d.ITEM_NAME}</td>
                                    <td style={{ textAlign: 'center' }}>${Number(d.PRICE_AT_SALE).toFixed(0)}</td>
                                    <td style={{ textAlign: 'center' }}>x {d.QUANTITY}</td>
                                    <td style={{ textAlign: 'right', padding: '8px' }}>
                                      ${(d.PRICE_AT_SALE * d.QUANTITY).toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="detail-footer">
                              {/* 左側備註區 */}
                              <strong>訂單備註：</strong> {order.NOTE || '無備註'}

                              {/* 右側金額計算區 */}
                              <div className="footer-total">
                                品項小計： <strong>${(Number(order.ORDER_MOUNT) + Number(order.DISCOUNT)).toFixed(2)}</strong>
                                折扣讓利 (DISCOUNT)： <strong>-${Number(order.DISCOUNT).toFixed(2)}</strong>

                                {/* 最終實收金額線條與強調 */}
                                <span>應付實收總額：</span>
                                <strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="loading-spinner">正在檢索明細...</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>此日期區間內無任何訂單資料</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AUDIT;