import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Management.css';

const ORDER_DETAIL = () => {
  const { orderId } = useParams();
  const [details, setDetails] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]); // 新增：儲存過濾後的品項
  const [types, setTypes] = useState([]); // 新增：儲存所有的 Type 種類
  const [selectedType, setSelectedType] = useState(''); // 新增：目前的過濾類別

  const [newDetail, setNewDetail] = useState({ itemId: '', quantity: 1, discount: 100 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = 'http://localhost:3002';

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ORDER_DETAIL/${orderId}`);
      if (!response.ok) throw new Error('無法取得訂單明細');
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE}/ITEM`);
      if (!response.ok) throw new Error('無法載入品項列表');
      const data = await response.json();
      setItems(data);
      setFilteredItems(data); // 初始狀態顯示全部

      // 提取所有不重複的 Type
      const uniqueTypes = [...new Set(data.map(item => item.Type).filter(t => t))];
      setTypes(uniqueTypes);
    } catch (err) {
      setError(err.message);
    }
  };

  // 當選擇的 Type 改變時，更新過濾列表
  useEffect(() => {
    if (selectedType === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => item.Type === selectedType);
      setFilteredItems(filtered);
    }
    // 重置選取的品項，避免跨類別錯誤
    setNewDetail(prev => ({ ...prev, itemId: '' }));
  }, [selectedType, items]);

  const addDetail = async (e) => {
    e.preventDefault();
    const selectedItem = items.find(i => i.ITEM_ID === parseInt(newDetail.itemId));
    if (!selectedItem) return alert("請選擇品項");

    try {
      const response = await fetch(`${API_BASE}/ORDER_DETAIL`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(orderId),
          itemId: selectedItem.ITEM_ID,
          quantity: parseInt(newDetail.quantity),
          priceAtSale: selectedItem.ITEM_PRICE,
          saleInPercent: parseInt(newDetail.discount)
        })
      });
      if (!response.ok) throw new Error('新增失敗');
      setNewDetail({ itemId: '', quantity: 1, discount: 100 });
      fetchDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteDetail = async (id) => {
    if (!window.confirm('確定移除此項目？')) return;
    try {
      await fetch(`${API_BASE}/ORDER_DETAIL/${id}`, { method: 'DELETE' });
      fetchDetails();
    } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    fetchDetails();
    fetchItems();
  }, [orderId]);

  return (
    <div className="container">
      <Link to="/ORDER" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← 返回訂單列表
      </Link>

      <h1>訂單詳情 # {orderId}</h1>
      {error && <div className="error-message">⚠️ {error}</div>}

      <form onSubmit={addDetail} className="item-form">
        <h3>新增品項</h3>
        <div className="form-grid">
          {/* 新增：Type 過濾選單 */}
          <div className="form-group">
            <label>類別:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">-- 顯示全部類別 --</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 品項選單 (受過濾影響) */}
          <div className="form-group">
            <label>選擇品項:</label>
            <select
              value={newDetail.itemId}
              onChange={(e) => setNewDetail({ ...newDetail, itemId: e.target.value })}
              required
            >
              <option value="">-- 請先選擇類別 --</option>
              {filteredItems.map(i => (
                <option key={i.ITEM_ID} value={i.ITEM_ID}>
                  {i.ITEM_NAME} (${Number(i.ITEM_PRICE).toFixed(0)})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>數量:</label>
            <input type="number" min="1" value={newDetail.quantity} onChange={(e) => setNewDetail({ ...newDetail, quantity: e.target.value })} required />
          </div>

          <div className="form-group">
            <label>折扣 (%):</label>
            <input type="number" min="0" max="100" value={newDetail.discount} onChange={(e) => setNewDetail({ ...newDetail, discount: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>新增至訂單</button>
      </form>

      <h2>品項明細</h2>
      {loading ? <p>資料載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>品項名稱</th>
              <th>原價</th>
              <th>數量</th>
              <th>折扣</th>
              <th>小計</th>
              <th>狀態</th>
            </tr>
          </thead>
          <tbody>
            {details.length > 0 ? details.map(d => (
              <tr key={d.DETAIL_ID}>
                <td><strong>{d.ITEM_NAME}</strong></td>
                <td>${Number(d.PRICE_AT_SALE).toFixed(2)}</td>
                <td>{d.QUANTITY}</td>
                <td><span className="type-badge">{d.SALE_IN_PERCENT}%</span></td>
                <td><strong>${(d.PRICE_AT_SALE * d.QUANTITY * (d.SALE_IN_PERCENT / 100)).toFixed(2)}</strong></td>
                <td>
                  {/* 合併後的狀態與出單按鈕 */}
                  <button
                    className="btn-primary"
                    disabled={d.SEND === 1} // 如果 SEND 為 1 則禁用按鈕
                    style={{
                      backgroundColor: d.SEND === 1 ? '#b7eb8f' : '#faad14', // 已出單顯示淺綠，未出單顯示橘色
                      borderColor: d.SEND === 1 ? '#b7eb8f' : '#faad14',
                      cursor: d.SEND === 1 ? 'not-allowed' : 'pointer',
                      color: d.SEND === 1 ? '#52c41a' : 'white',
                      width: '100px',
                      fontWeight: 'bold'
                    }}
                    onClick={async () => {
                      try {
                        const response = await fetch(`${API_BASE}/ORDER_DETAIL/send/${d.DETAIL_ID}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sendStatus: 1 })
                        });
                        if (!response.ok) throw new Error('更新狀態失敗');
                        fetchDetails(); // 重新整理明細列表以更新主表狀態
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                  >
                    {d.SEND === 1 ? '已出單' : '點擊出單'}
                  </button>

                  {/* 只有在尚未出單的情況下才允許移除，避免帳務混亂 */}
                  {d.SEND === 0 && (
                    <button
                      onClick={() => deleteDetail(d.DETAIL_ID)}
                      className="btn-delete"
                      style={{ marginLeft: '10px' }}
                    >
                      移除
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>目前無明細</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ORDER_DETAIL;