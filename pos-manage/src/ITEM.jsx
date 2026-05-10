import React, { useState, useEffect, useRef } from 'react';

const ITEM = ({ API_BASE }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', pictureUrl: '', type: 'SPARKLING' }); // 預設值
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- 無限下拉專用狀態與 Ref ---
  const [displayLimit, setDisplayLimit] = useState(20);
  const observerTarget = useRef(null);

  // --- 定義品項種類選項 ---
  const ITEM_TYPES = [
    { value: 'SPARKLING', label: '氣泡 (SPARKLING)' },
    { value: 'CLASSIC', label: '經典 (CLASSIC)' },
    { value: 'SHOTS', label: '一口酒 (SHOTS)' },
    { value: 'GATHERING_DRINKS', label: '聚會飲品 (GATHERING_DRINKS)' },
    { value: 'TASTING_MENU', label: '品味菜單 (TASTING_MENU)' },
    { value: 'SIGNATURE', label: '原創 (SIGNATURE)' },
    { value: 'TASTING_GIN', label: '單杯 琴酒 (TASTING GIN)' },
    { value: 'TASTING_WHISKEY', label: '單杯 威士忌 (TASTING WHISKEY)' },
    { value: 'TASTING_RUM', label: '單杯 蘭姆 (TASTING RUM)' },
    { value: 'TASTING_VODKA', label: '單杯 伏特加 (TASTING VODKA)' },
    { value: 'TASTING_TEQUILA', label: '單杯 龍舌蘭 (TASTING TEQUILA)' },
    { value: 'OTHER', label: '其他 (OTHER)' }
  ];

  const [sortConfig, setSortConfig] = useState({ key: 'ITEM_ID', direction: 'desc' }); // 預設改用 desc 讓最新新增的在上面比較好找

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
    // 切換排序時，重置顯示筆數，讓畫面回到最頂端
    setDisplayLimit(20);
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
    if (!window.confirm('確定要刪除這個品項嗎？')) return;
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
    // 編輯時自動滾動到最上方表單
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (id, currentActive) => {
    try {
      const response = await fetch(`${API_BASE}/ITEM/${id}/active`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: currentActive === 1 ? 0 : 1
        })
      });
      if (!response.ok) throw new Error('Failed to toggle active status');
      fetchItems();
    } catch (err) {
      setError(err.message);
    }
  };

  // 初始載入資料
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 無限下拉：Intersection Observer 監聽邏輯
  useEffect(() => {
    // 如果正在載入資料，先不綁定觀察器 (因為此時 table 還沒渲染)
    if (loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 當畫面滑到觀察目標時，把顯示數量加上 20 筆
        if (entries[0].isIntersecting) {
          setDisplayLimit((prevLimit) => prevLimit + 20);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px 200px 0px' } // 提早 200px 觸發載入
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loading]); // 依賴 loading，確保 table 渲染出來後再綁定

  const [expandedId, setExpandedId] = useState(null);

  const toggleDescription = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const sortedItems = getSortedItems();
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕︎';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const handleImgError = (e) => {
    e.target.src = "https://posfront-psi.vercel.app/placeholder.png";
  };

  const formatImageUrl = (url) => {
    if (!url) return "https://posfront-psi.vercel.app/placeholder.png";

    if (url.includes("drive.google.com")) {
      let fileId = "";
      try {
        if (url.includes("/d/")) {
          fileId = url.split('/d/')[1]?.split('/')[0];
        } else if (url.includes("id=")) {
          fileId = url.split('id=')[1]?.split('&')[0];
        }
        // 修復了字串串接 Bug，並改用穩定性較高的快取路徑 2
        return `https://googleusercontent.com/profile/picture/2${fileId}`;
      } catch (e) {
        return "https://posfront-psi.vercel.app/placeholder.png";
      }
    }

    if (url.startsWith("img/")) {
      const baseUrl = "https://posfront-psi.vercel.app/";
      return baseUrl + url;
    }

    return url;
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1>品項管理</h1>
      </header>

      {error && <div className="error-message-box">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="item-form admin-card">
        <h2>{editingItem ? '編輯品項' : '新增品項'}</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>名稱</label>
            <input
              type="text"
              className="form-input"
              value={editingItem ? editingItem.ITEM_NAME : newItem.name}
              onChange={(e) => editingItem
                ? setEditingItem({ ...editingItem, ITEM_NAME: e.target.value })
                : setNewItem({ ...newItem, name: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>價格</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={editingItem ? editingItem.ITEM_PRICE : newItem.price}
              onChange={(e) => editingItem
                ? setEditingItem({ ...editingItem, ITEM_PRICE: e.target.value })
                : setNewItem({ ...newItem, price: e.target.value })
              }
              required
            />
          </div>
          <div className="form-group">
            <label>種類</label>
            <select
              className="form-select"
              value={editingItem ? editingItem.Type : newItem.type}
              onChange={(e) => editingItem
                ? setEditingItem({ ...editingItem, Type: e.target.value })
                : setNewItem({ ...newItem, type: e.target.value })
              }
              required
            >
              {ITEM_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>圖片連結</label>
            <input
              type="text"
              className="form-input"
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
            <label>描述</label>
            <textarea
              className="form-textarea"
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
          {editingItem && (
            <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">取消</button>
          )}
        </div>
      </form>

      <section className="list-section">
        <h2>品項清單</h2>
        {loading ? <p className="loading-text">載入中...</p> : (
          <table className="item-table">
            <thead>
              <tr>
                <th className="sortable-th" onClick={() => requestSort('ITEM_ID')}>ID {getSortIcon('ITEM_ID')}</th>
                <th>圖片</th>
                <th className="sortable-th" onClick={() => requestSort('ITEM_NAME')}>名稱 {getSortIcon('ITEM_NAME')}</th>
                <th className="sortable-th" onClick={() => requestSort('Type')}>類型 {getSortIcon('Type')}</th>
                <th className="sortable-th" onClick={() => requestSort('ITEM_PRICE')}>價格 {getSortIcon('ITEM_PRICE')}</th>
                <th>描述</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {/* 利用 slice 限制只渲染當前 displayLimit 數量的資料 */}
              {sortedItems.slice(0, displayLimit).map(item => (
                <tr key={item.ITEM_ID}>
                  <td data-label="ID">{item.ITEM_ID}</td>
                  <td data-label="圖片">
                    {item.PICTURE_URL ? (
                      <img
                        src={formatImageUrl(item.PICTURE_URL)}
                        alt={item.ITEM_NAME}
                        className="item-thumbnail"
                        onError={handleImgError}
                      />
                    ) : <span className="no-img-text">無圖片</span>}
                  </td>
                  <td data-label="名稱" className="item-name-cell">{item.ITEM_NAME}</td>
                  <td data-label="類型"><span className="type-badge">{item.Type}</span></td>
                  <td data-label="價格" className="item-price-tag">${item.ITEM_PRICE}</td>
                  <td
                    data-label="描述"
                    className={`description-cell ${expandedId === item.ITEM_ID ? 'expanded' : ''}`}
                    onClick={() => toggleDescription(item.ITEM_ID)}
                  >
                    {item.Description}
                  </td>
                  <td data-label="操作" className="action-cell">
                    <button type="button" className="btn-edit" onClick={() => handleEdit(item)}>編輯</button>
                    <button type="button" className="btn-delete" onClick={() => deleteItem(item.ITEM_ID)}>刪除</button>
                    <button
                      type="button"
                      className={`active-toggle-btn ${item.is_active === 1 || item.is_active === '1' ? 'active' : 'inactive'}`}
                      onClick={() => toggleActive(item.ITEM_ID, item.is_active)}
                    >
                      {item.is_active === 1 || item.is_active === '1' ? '已啟用' : '未啟用'}
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* 如果還有更多資料未顯示，渲染這個隱藏的觀察目標來觸發載入 */}
              {displayLimit < sortedItems.length && (
                <tr ref={observerTarget}>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    向下捲動載入更多...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default ITEM;