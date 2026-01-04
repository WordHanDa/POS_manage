import React, { useState, useEffect } from 'react';
import './Management.css';

const ITEM = ({API_BASE}) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', pictureUrl: '', type: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 新增：排序狀態 ---
  // key: 排序的欄位名稱, direction: 'asc' (升序) 或 'desc' (降序)
  const [sortConfig, setSortConfig] = useState({ key: 'ITEM_ID', direction: 'asc' });

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

  // --- 新增：處理排序點擊的函數 ---
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- 新增：計算排序後的資料 ---
  const getSortedItems = () => {
    const sortableItems = [...items];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // 處理數字與字串的比較
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
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
      setNewItem({ name: '', price: '', description: '', pictureUrl: '', type: '' });
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
    if (editingItem) {
      updateItem();
    } else {
      addItem();
    }
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
  };

  const cancelEdit = () => {
    setEditingItem(null);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 取得當前排序後的陣列
  const sortedItems = getSortedItems();

  // 輔助函式：顯示排序圖示
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '🔼' : '🔽';
  };

  return (
    <div className="container">
      <h1>品項管理</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingItem ? '編輯品項' : '新增品項'}</h2>
        
        <div className="form-grid">
          <div className="form-group">
            <label>名稱: </label>
            <input
              type="text"
              value={(editingItem ? editingItem.ITEM_NAME : newItem.name || '')}
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
              value={(editingItem ? editingItem.ITEM_PRICE : newItem.price) || ''}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, ITEM_PRICE: e.target.value })
                : setNewItem({ ...newItem, price: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>種類: </label>
            <input
              type="text"
              placeholder="例如：飲料、食物"
              value={(editingItem ? editingItem.Type : newItem.type) || ''}
              onChange={(e) => editingItem 
                ? setEditingItem({ ...editingItem, Type: e.target.value })
                : setNewItem({ ...newItem, type: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>圖片連結: </label>
            <input
              type="text"
              placeholder="http://..."
              value={(editingItem ? editingItem.PICTURE_URL : newItem.pictureUrl) || ''}
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
            value={(editingItem ? editingItem.Description : newItem.description) || ''}
            onChange={(e) => editingItem 
              ? setEditingItem({ ...editingItem, Description: e.target.value })
              : setNewItem({ ...newItem, description: e.target.value })
            }
          />
          </div>
        </div>

        <div className="button-group">
          <button type="submit" className="btn-primary">
            {editingItem ? '更新' : '加入'}品項
          </button>
          {editingItem && (
            <button type="button" onClick={cancelEdit} className="btn-secondary">
              取消
            </button>
          )}
        </div>
      </form>

      {/* Items List */}
      <h2>品項清單</h2>
      {loading ? <p>載入中...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              {/* 點擊標籤進行排序 */}
              <th onClick={() => requestSort('ITEM_ID')} style={{ cursor: 'pointer' }}>
                ID {getSortIcon('ITEM_ID')}
              </th>
              <th>圖片</th>
              <th onClick={() => requestSort('ITEM_NAME')} style={{ cursor: 'pointer' }}>
                名稱 {getSortIcon('ITEM_NAME')}
              </th>
              <th onClick={() => requestSort('Type')} style={{ cursor: 'pointer' }}>
                類型 {getSortIcon('Type')}
              </th>
              <th onClick={() => requestSort('ITEM_PRICE')} style={{ cursor: 'pointer' }}>
                價格 {getSortIcon('ITEM_PRICE')}
              </th>
              <th>描述</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.ITEM_ID}>
                <td>{item.ITEM_ID}</td>
                <td>
                  {item.PICTURE_URL ? (
                    <img src={item.PICTURE_URL} alt={item.ITEM_NAME} className="item-thumbnail" />
                  ) : 'No Image'}
                </td>
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