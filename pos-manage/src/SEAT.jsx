import React, { useState, useEffect, useRef } from 'react';

const UNIT_SIZE = 40; // 1單位 = 40px
const MAX_UNITS = 20; // 您設定的最大單位數

const SEAT = ({ API_BASE }) => {
  const [seats, setSeats] = useState([]);
  const [newSeat, setNewSeat] = useState({ seatName: '', x: 0, y: 0 });
  const [editingSeat, setEditingSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);

  // --- 1. 統一的輸入框處理函式 (解決無法修改問題) ---
  const handleFieldChange = (field, value) => {
    if (editingSeat) {
      // 編輯模式下，映射到資料庫欄位名稱
      const fieldMap = {
        seatName: 'SEAT_NAME',
        x: 'POSITION_X',
        y: 'POSITION_Y'
      };
      setEditingSeat({
        ...editingSeat,
        [fieldMap[field] || field]: value
      });
    } else {
      // 新增模式
      setNewSeat({
        ...newSeat,
        [field]: value
      });
    }
  };

  // --- 2. 拖拽邏輯 ---
  const handleDragStart = (e, seatId) => {
    e.dataTransfer.setData("seatId", seatId);
    // 隱藏預設拖動影像，讓操作更平滑
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const seatId = e.dataTransfer.getData("seatId");
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();

    // 計算考慮捲軸後的相對像素位置
    const clientX = e.clientX - rect.left + container.scrollLeft;
    const clientY = e.clientY - rect.top + container.scrollTop;

    // 換算成網格單位並四捨五入
    const unitX = Math.max(0, Math.min(MAX_UNITS, Math.round(clientX / UNIT_SIZE)));
    const unitY = Math.max(0, Math.min(MAX_UNITS, Math.round(clientY / UNIT_SIZE)));

    const seatToUpdate = seats.find(s => s.SEAT_ID === parseInt(seatId));
    if (!seatToUpdate) return;

    // 拖動放下後直接更新資料庫
    await submitUpdate(seatToUpdate.SEAT_ID, seatToUpdate.SEAT_NAME, unitX, unitY);
  };

  const fetchSeats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/SEAT`);
      if (!response.ok) throw new Error('Failed to fetch seats');
      const data = await response.json();
      setSeats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 抽離出更新 API 邏輯供拖拽與表單共用
  const submitUpdate = async (id, name, x, y) => {
    try {
      const response = await fetch(`${API_BASE}/SEAT/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatName: name, x, y })
      });
      if (!response.ok) throw new Error('Update failed');
      setEditingSeat(null);
      fetchSeats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSeat) {
      await submitUpdate(
        editingSeat.SEAT_ID,
        editingSeat.SEAT_NAME,
        editingSeat.POSITION_X,
        editingSeat.POSITION_Y
      );
    } else {
      // 新增座位
      try {
        const response = await fetch(`${API_BASE}/SEAT`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSeat)
        });
        if (!response.ok) throw new Error('Add failed');
        setNewSeat({ seatName: '', x: 0, y: 0 });
        fetchSeats();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const deleteSeat = async (id) => {
    if (!window.confirm('確定要刪除嗎？')) return;
    try {
      const response = await fetch(`${API_BASE}/SEAT/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Delete failed');
      fetchSeats();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  return (
    <div className="container">
      <header className="page-header">
        <h1>座位管理</h1>
      </header>

      {error && <div className="error-message-box">⚠️ {error}</div>}

      <div className="seat-management-layout">
        {/* 左側：表單 */}
        <div className="form-section">
          <form onSubmit={handleSubmit} className="item-form admin-card">
            <div className='form-seat'>
              <h2>{editingSeat ? '編輯座位' : '新增座位'}</h2>
              <div className="form-group">
                <label>座位名稱</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingSeat ? editingSeat.SEAT_NAME : newSeat.seatName}
                  onChange={(e) => handleFieldChange('seatName', e.target.value)}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>X (單位)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingSeat ? editingSeat.POSITION_X : newSeat.x}
                    onChange={(e) => handleFieldChange('x', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label>Y (單位)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingSeat ? editingSeat.POSITION_Y : newSeat.y}
                    onChange={(e) => handleFieldChange('y', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="btn-primary">{editingSeat ? '更新' : '儲存'}</button>
                {editingSeat && (
                  <button type="button" onClick={() => setEditingSeat(null)} className="btn-secondary">取消</button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* 右側：2D 平面畫布 */}
        <div className="preview-section">
          <div
            className="canvas-scroll-viewport"
            ref={scrollContainerRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div
              className="floor-plan-grid"
              style={{
                width: `${MAX_UNITS * UNIT_SIZE}px`,
                height: `${MAX_UNITS * UNIT_SIZE}px`,
                backgroundSize: `${UNIT_SIZE}px ${UNIT_SIZE}px`
              }}
            >
              {seats.map(seat => (
                <div
                  key={seat.SEAT_ID}
                  className={`seat-unit-box ${editingSeat?.SEAT_ID === seat.SEAT_ID ? 'is-active' : ''}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, seat.SEAT_ID)}
                  onClick={() => setEditingSeat(seat)}
                  style={{
                    left: `${seat.POSITION_X * UNIT_SIZE}px`,
                    top: `${seat.POSITION_Y * UNIT_SIZE}px`,
                    width: `${UNIT_SIZE}px`,
                    height: `${UNIT_SIZE}px`
                  }}
                >
                  {seat.SEAT_NAME}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="list-section">
        <h2>座位列表</h2>
        {loading ? <p className="loading-text">載入中...</p> : (
          <table className="item-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名稱</th>
                <th>座標 (X/Y)</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {seats.map(seat => (
                <tr key={seat.SEAT_ID}>
                  <td data-label="ID">{seat.SEAT_ID}</td>
                  <td data-label="名稱"><strong>{seat.SEAT_NAME}</strong></td>
                  <td data-label="座標">{seat.POSITION_X} / {seat.POSITION_Y}</td>
                  <td data-label="操作" className="text-right">
                    <button onClick={() => setEditingSeat(seat)} className="btn-primary btn-action-sm">編輯</button>
                    <button onClick={() => deleteSeat(seat.SEAT_ID)} className="btn-delete btn-delete-margin">刪除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default SEAT;