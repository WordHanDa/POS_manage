import React, { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  // 用於 PDF 選取的 Ref
  const pdfExportRef = useRef(null);

  // 1. 取得所有訂單
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // 加上時間戳記防止快取
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

  // 2. 展開明細並獲取資料
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

  // 3. 匯出 PDF 邏輯
  const exportToPDF = async (orderId) => {
    const element = pdfExportRef.current;
    if (!element) return;

    const btn = element.querySelector('.no-pdf');
    if (btn) btn.style.visibility = 'hidden';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');

      // --- 解決亂碼核心程式碼 ---
      const pdf = new jsPDF('p', 'mm', 'a4');

      // 1. 載入字體 (請將 'BASE64_STRING_HERE' 替換為實際轉換後的 Base64 字串)
      const myFont = "BASE64_STRING_HERE";

      // 2. 將字體加入虛擬檔案系統
      pdf.addFileToVFS("MyFont.ttf", myFont);

      // 3. 註冊字體
      pdf.addFont("MyFont.ttf", "MyFont", "normal");

      // 4. 設定使用該字體
      pdf.setFont("MyFont");
      // ------------------------

      pdf.setFontSize(16);
      // 現在這裡的中文就能正常顯示，不再是亂碼
      pdf.text(`訂單稽核報告 - 單號 #${orderId}`, 10, 15);

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 25, imgWidth, imgHeight);

      pdf.save(`Order_Audit_${orderId}.pdf`);
    } catch (err) {
      console.error('PDF 產生失敗:', err);
      alert('無法產生 PDF 檔案');
    } finally {
      if (btn) btn.style.visibility = 'visible';
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 篩選與排序邏輯
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.ORDER_DATE);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      return (!start || orderDate >= start) && (!end || orderDate <= end);
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

  const stats = useMemo(() => {
    return filteredOrders.reduce((acc, o) => {
      acc.totalRevenue += parseFloat(o.ORDER_MOUNT || 0);
      acc.totalDiscount += parseFloat(o.DISCOUNT || 0);
      return acc;
    }, { totalRevenue: 0, totalDiscount: 0 });
  }, [filteredOrders]);

  return (
    <div className="container audit-container">
      <header className="audit-header">
        <h1>會計稽核管理</h1>
        <div className="summary-cards">
          <div className="card card-total-count">
            <h3>篩選訂單數</h3>
            <p className="card-value">{filteredOrders.length} 筆</p>
          </div>
          <div className="card card-revenue">
            <h3>區間總營收</h3>
            <p className="card-value">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="card card-discount">
            <h3>已折讓總額</h3>
            <p className="card-value">-${stats.totalDiscount.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <div className="filter-panel">
        <div className="filter-group">
          <label>日期範圍：</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <span>至</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          {(startDate || endDate) && <button className="btn-clear" onClick={() => { setStartDate(''); setEndDate(''); }}>重置</button>}
        </div>
      </div>

      {error && (
        <div className="error-message-box">
          <i className="fa-solid fa-circle-exclamation"></i> 系統錯誤：{error}
        </div>
      )}

      {loading ? <p>正在讀取資料庫...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th onClick={() => setSortConfig({ key: 'ORDER_ID', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>單號 ↕</th>
              <th>桌號</th>
              <th>成交時間</th>
              <th>應付總額</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedOrders.map(order => (
              <React.Fragment key={order.ORDER_ID}>
                <tr className={expandedOrder === order.ORDER_ID ? 'expanded-row' : ''}>
                  <td data-label="單號">#{order.ORDER_ID}</td>
                  <td data-label="桌號">{order.SEAT_NAME || order.SEAT_ID}</td>
                  <td data-label="成交時間">{new Date(order.ORDER_DATE).toLocaleDateString('sv-SE').split('T')[0]}</td>
                  <td data-label="應付總額" className="price-cell">
                    <strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong>
                    {order.DISCOUNT > 0 && <span className="discount-tag">(折 -${order.DISCOUNT})</span>}
                  </td>
                  <td data-label="操作">
                    <button className="btn-secondary" onClick={() => toggleExpand(order.ORDER_ID)}>
                      {expandedOrder === order.ORDER_ID ? '收合' : '明細'}
                    </button>
                  </td>
                </tr>

                {expandedOrder === order.ORDER_ID && (
                  <tr className="detail-row">
                    <td colSpan="5" className="detail-container-cell">
                      <div ref={pdfExportRef} className="audit-detail-card">
                        <div className="detail-header">
                          <h4>單號 #{order.ORDER_ID}</h4>
                          <time>{new Date(order.ORDER_DATE).toLocaleString('zh-TW', { timeZone: 'UTC' })}</time><br />
                          <div className="detail-actions">
              
                            <span className={`status-badge ${order.settle === 1 ? 'settled' : 'unsettled'}`}>
                              {order.settle === 1 ? '已結清' : '未結清'}
                            </span>
                          </div>
                        </div>

                        {orderDetails.length > 0 ? (
                          <div className="detail-body">
                            <table className="inner-detail-table">
                              <thead>
                                <tr>
                                  <th>品項</th>
                                  <th>單價</th>
                                  <th>數量</th>
                                  <th>折扣％</th>
                                  <th className="text-right">小計</th>
                                </tr>
                              </thead>
                              <tbody>
                                {orderDetails.map(d => (
                                  <tr key={d.DETAIL_ID}>
                                    <td data-label="品項">{d.ITEM_NAME}</td>
                                    <td data-label="單價">${Number(d.PRICE_AT_SALE).toFixed(0)}</td>
                                    <td data-label="數量">x {d.QUANTITY}</td>
                                    <td data-label="折扣％">{(d.SALE_IN_PERCENT !== 100) ? `${100 - d.SALE_IN_PERCENT}%` : '-'}</td>
                                    <td data-label="小計" className="text-right">${(d.PRICE_AT_SALE * d.QUANTITY * d.SALE_IN_PERCENT * 0.01).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            <div className="detail-footer">
                              <div className="footer-notes">
                                <strong>訂單備註：</strong><br />
                                <span className="note-text">{order.NOTE || '無備註'}</span>
                              </div>
                              <div className="footer-total">
                                <div className="total-row subtotal">品項小計：<div className='total-value'>${(Number(order.ORDER_MOUNT) + Number(order.DISCOUNT)).toFixed(2)}</div></div>
                                <div className="total-row discount">折扣：<div className='total-value'>-${Number(order.DISCOUNT).toFixed(2)}</div> </div>
                                <div className="total-row grand-total">
                                  應付實收總額：<div className='total-value'><strong>${Number(order.ORDER_MOUNT).toFixed(2)}</strong></div>
                                </div>
                              </div>
                            </div>
                            <button className="btn-primary no-pdf" onClick={() => exportToPDF(order.ORDER_ID)}>
                              匯出 PDF
                            </button>
                          </div>
                        ) : <p className="loading-text">載入明細中...</p>}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AUDIT;