import React, { useState, useEffect } from 'react';
import './Management.css';

const ITEM = ({ API_BASE }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', pictureUrl: '', type: 'SPARKLING' }); // 預設值
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 定義品項種類選項 ---
  const ITEM_TYPES = [
    { value: 'SPARKLING', label: '氣泡酒 (SPARKLING)' },
    { value: 'SHOT', label: '一口酒 (SHOTS)' },
    { value: 'GATHERING_DRINKS', label: '聚會飲品 (GATHERING_DRINKS)' },
    { value: 'TASTING_MENU', label: '品味菜單 (TASTING_MENU)' },
    { value: 'SIGNATURE', label: '原創 (SIGNATURE)' },
    { value: 'TASTING_GIN', label: '單杯 琴酒 (TASTING GIN)' },
    { value: 'TASTING_WHISKY', label: '單杯 威士忌 (TASTING WHISKY)' },
    { value: 'TASTING_RUM', label: '單杯 蘭姆 (TASTING RUM)' },
    { value: 'TASTING_VODKA', label: '單杯 伏特加 (TASTING VODKA)' },
    { value: 'TASTING_TEQUILA', label: '單杯 龍舌蘭 (TASTING TEQUILA)' },
    { value: 'OTHER', label: '其他 (OTHER)' }
  ];

  const [sortConfig, setSortConfig] = useState({ key: 'ITEM_ID', direction: 'asc' });

  // ... (fetchItems, requestSort, getSortedItems 邏輯保持不變) ...
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/ITEM`);
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    const sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  };

  const addItem = async () => {
    try {
      const response = await fetch(`${API_BASE}/ITEM`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItem.name,
          price: parseFloat(newItem.price),
          description: newItem.description,
          pictureUrl: newItem.pictureUrl,
          type: newItem.type
        })
      });
      if (!response.ok) throw new Error('Failed to add item');
      setNewItem({ name: '', price: '', description: '', pictureUrl: '', type: 'SPARKLING' });
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateItem = async () => {
    try {
      const response = await fetch(`${API_BASE}/ITEM/${editingItem.ITEM_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingItem.ITEM_NAME,
          price: parseFloat(editingItem.ITEM_PRICE),
          description: editingItem.Description,
          pictureUrl: editingItem.PICTURE_URL,
          type: editingItem.Type
        })
      });
      if (!response.ok) throw new Error('Failed to update item');
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await fetch(`${API_BASE}/ITEM/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete item');
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    editingItem ? updateItem() : addItem();
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const sortedItems = getSortedItems();
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '🔼' : '🔽';
  };

  return (
    <div className="container">
      <h1>品項管理</h1>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingItem ? '編輯品項' : '新增品項'}</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>名稱: </label>
            <input
              type="text"
              value={editingItem ? editingItem.ITEM_NAME : newItem.name}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, ITEM_NAME: e.target.value })
                : setNewItem({ ...newItem, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>價格: </label>
            <input
              type="number"
              step="0.01"
              value={editingItem ? editingItem.ITEM_PRICE : newItem.price}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, ITEM_PRICE: e.target.value })
                : setNewItem({ ...newItem, price: e.target.value })
              }
              required
            />
          </div>
          
          {/* --- 修改：將 Type 改為 Select --- */}
          <div className="form-group">
            <label>種類: </label>
            <select
              value={editingItem ? editingItem.Type : newItem.type}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, Type: e.target.value })
                : setNewItem({ ...newItem, type: e.target.value })
              }
              required
            >
              {ITEM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>圖片連結: </label>
            <input
              type="text"
              value={editingItem ? editingItem.PICTURE_URL : newItem.pictureUrl}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, PICTURE_URL: e.target.value })
                : setNewItem({ ...newItem, pictureUrl: e.target.value })
              }
            />
          </div>
        </div>

        <div className="description-area">
          <div className="form-group">
            <label>描述: </label>
            <textarea
              value={editingItem ? editingItem.Description : newItem.description}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, Description: e.target.value })
                : setNewItem({ ...newItem, description: e.target.value })
              }
            />
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">{editingItem ? '更新' : '加入'}品項</button>
          {editingItem && <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">取消</button>}
        </div>
      </form>

      <h2>品項清單</h2>
      {loading ? <p>載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('ITEM_ID')} style={{ cursor: 'pointer' }}>ID {getSortIcon('ITEM_ID')}</th>
              <th>圖片</th>
              <th onClick={() => requestSort('ITEM_NAME')} style={{ cursor: 'pointer' }}>名稱 {getSortIcon('ITEM_NAME')}</th>
              <th onClick={() => requestSort('Type')} style={{ cursor: 'pointer' }}>類型 {getSortIcon('Type')}</th>
              <th onClick={() => requestSort('ITEM_PRICE')} style={{ cursor: 'pointer' }}>價格 {getSortIcon('ITEM_PRICE')}</th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.ITEM_ID}>
                <td>{item.ITEM_ID}</td>
                <td>{item.PICTURE_URL ? <img src={item.PICTURE_URL} alt={item.ITEM_NAME} className="item-thumbnail" /> : 'No Image'}</td>
                <td>{item.ITEM_NAME}</td>
                <td><span className="type-badge">{item.Type}</span></td>
                <td>${item.ITEM_PRICE}</td>
                <td className="description-cell">{item.Description}</td>
                <td>
                  <button onClick={() => handleEdit(item)}>編輯</button>
                  <button onClick={() => deleteItem(item.ITEM_ID)} className="btn-delete">刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ITEM;