import React, { useState, useEffect } from 'react';
import './Management.css';

const AUDIT = (API_BASE) => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null); // 儲存目前展開的訂單 ID
  const [orderDetails, setOrderDetails] = useState([]);    // 儲存明細資料
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 篩選狀態
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ORDER_ID', direction: 'desc' });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 假設後端有一個取得所有訂單總表（帶有總金額）的 API
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

  // 展開訂單並取得明細
  const toggleExpand = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    setOrderDetails([]); // 展開新訂單前先清空舊明細，避免畫面閃爍舊資料
    try {
      const response = await fetch(`${API_BASE}/ORDER_DETAIL/${orderId}`);
      const data = await response.json();
      setOrderDetails(data);
    } catch (err) {
      console.error("載入明細失敗", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- 篩選與排序邏輯 ---
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.ORDER_DATE || order.CreatedAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    return (!start || orderDate >= start) && (!end || orderDate <= end);
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.TOTAL_PRICE) || 0), 0);

  return (
    <div className="container audit-container">
      {/* 標頭與統計卡片部分 */}
      <header className="audit-header">
        <h1>訂單帳務稽核 (Audit)</h1>
        <div className="summary-cards">
          <div className="card">
            <h3>期間訂單總數</h3>
            <p className="card-value">{filteredOrders.length}</p>
          </div>
          <div className="card" style={{ borderTopColor: '#52c41a' }}>
            <h3>總營業額 (已入帳)</h3>
            <p className="card-value">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </header>

      {/* 錯誤訊息顯示 */}
      {error && (
        <div className="error-message" style={{ color: 'red', backgroundColor: '#fff2f0', padding: '10px', borderRadius: '4px', marginBottom: '20px', border: '1px solid #ffccc7' }}>
          ⚠️ 錯誤：{error}
        </div>
      )}

      {/* 篩選工具列 */}
      <div className="filter-panel">
        <div className="filter-group">
          <label>日期範圍：</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>至</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {(startDate || endDate) && (
            <button className="btn-clear" onClick={() => { setStartDate(''); setEndDate(''); }}>重置範圍</button>
          )}
        </div>
      </div>

      {loading ? <p>資料載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th onClick={() => setSortConfig({ key: 'ORDER_ID', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })} style={{ cursor: 'pointer' }}>
                訂單編號 {sortConfig.key === 'ORDER_ID' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
              </th>
              <th>下單時間</th>
              <th>客戶資訊</th>
              <th>總金額</th>
              <th>狀態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.length > 0 ? sortedOrders.map(order => (
              <React.Fragment key={order.ORDER_ID}>
                <tr className={expandedOrder === order.ORDER_ID ? 'expanded-row' : ''}>
                  <td>#{order.ORDER_ID}</td>
                  <td>{new Date(order.ORDER_DATE).toLocaleString()}</td>
                  <td>{order.CUSTOMER_NAME || '一般顧客'}</td>
                  <td className="price-cell"><strong>${Number(order.TOTAL_PRICE).toFixed(2)}</strong></td>
                  <td><span className="status-verified">已結帳</span></td>
                  <td>
                    <button className="btn-secondary" onClick={() => toggleExpand(order.ORDER_ID)}>
                      {expandedOrder === order.ORDER_ID ? '隱藏明細' : '查看明細'}
                    </button>
                  </td>
                </tr>

                {/* 展開的明細區塊 */}
                {expandedOrder === order.ORDER_ID && (
                  <tr>
                    <td colSpan="6" className="detail-expand-area">
                      <div className="inner-detail-table">
                        <h4>訂單內容明細</h4>
                        {orderDetails.length > 0 ? (
                          <table>
                            <thead>
                              <tr>
                                <th>品項</th>
                                <th>單價</th>
                                <th>數量</th>
                                <th>折扣</th>
                                <th>小計</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orderDetails.map(d => (
                                <tr key={d.DETAIL_ID}>
                                  <td>{d.ITEM_NAME}</td>
                                  <td>${Number(d.PRICE_AT_SALE).toFixed(2)}</td>
                                  <td>{d.QUANTITY}</td>
                                  <td>{d.SALE_IN_PERCENT}%</td>
                                  <td><strong>${(d.PRICE_AT_SALE * d.QUANTITY * (d.SALE_IN_PERCENT / 100)).toFixed(2)}</strong></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : <p>明細載入中...</p>}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  此日期區間內沒有訂單記錄。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AUDIT;