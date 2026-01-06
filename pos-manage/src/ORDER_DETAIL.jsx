import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Management.css';

const ORDER_DETAIL = ({ API_BASE }) => {
  const { orderId } = useParams();
  const [details, setDetails] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');

  // 狀態：管理正在編輯折扣的明細 ID 與數值
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [tempDiscount, setTempDiscount] = useState(100);

  const [newDetail, setNewDetail] = useState({ itemId: '', quantity: 1, discount: 100 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setFilteredItems(data);
      const uniqueTypes = [...new Set(data.map(item => item.Type).filter(t => t))];
      setTypes(uniqueTypes);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (selectedType === '') {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => item.Type === selectedType);
      setFilteredItems(filtered);
    }
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

  // 修改折扣的 API 請求 (通常後端需提供更新明細的路由)
  const handleUpdateDiscount = async (detailId) => {
    try {
      const response = await fetch(`${API_BASE}/ORDER_DETAIL/${detailId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleInPercent: parseInt(tempDiscount) })
      });
      if (!response.ok) throw new Error('修改折扣失敗');
      setEditingDiscountId(null);
      fetchDetails();
    } catch (err) {
      alert(err.message);
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

      {/* 表單區塊 */}
      <form onSubmit={addDetail} className="item-form">
        <h3>新增品項</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>類別:</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
              <option value="">-- 顯示全部類別 --</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
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
              <th>狀態/操作</th>
            </tr>
          </thead>
          <tbody>
            {details.length > 0 ? details.map(d => (
              <tr key={d.DETAIL_ID}>
                <td><strong>{d.ITEM_NAME}</strong></td>
                <td>${Number(d.PRICE_AT_SALE).toFixed(2)}</td>
                <td>{d.QUANTITY}</td>
                <td>
                  {editingDiscountId === d.DETAIL_ID ? (
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <input
                        type="number"
                        style={{ width: '60px', padding: '4px' }}
                        value={tempDiscount}
                        onChange={(e) => setTempDiscount(e.target.value)}
                      />
                      <button className="btn-primary" onClick={() => handleUpdateDiscount(d.DETAIL_ID)} style={{ padding: '2px 8px', margin: 0 }}>✓</button>
                      <button className="btn-secondary" onClick={() => setEditingDiscountId(null)} style={{ padding: '2px 8px', margin: 0 }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="type-badge">{d.SALE_IN_PERCENT}%</span>
                      {/* 如果尚未出單，則顯示明確的修改按鈕 */}
                      {d.SEND === 0 && (
                        <button
                          onClick={() => {
                            setEditingDiscountId(d.DETAIL_ID);
                            setTempDiscount(d.SALE_IN_PERCENT);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid #888',
                            color: '#888',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7em',
                            cursor: 'pointer'
                          }}
                        >
                          修改
                        </button>
                      )}
                    </div>
                  )}
                </td>

                <td><strong>${(d.PRICE_AT_SALE * d.QUANTITY * (d.SALE_IN_PERCENT / 100)).toFixed(2)}</strong></td>
                <td>
                  <button
                    className="btn-primary"
                    disabled={d.SEND === 1}
                    style={{
                      backgroundColor: d.SEND === 1 ? '#b7eb8f' : '#faad14',
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
                        fetchDetails();
                      } catch (err) { alert(err.message); }
                    }}
                  >
                    {d.SEND === 1 ? '已出單' : '點擊出單'}
                  </button>

                  {d.SEND === 0 && (
                    <button onClick={() => deleteDetail(d.DETAIL_ID)} className="btn-delete" style={{ marginLeft: '10px' }}>
                      移除
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>目前無明細</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ORDER_DETAIL;