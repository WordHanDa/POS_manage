import React, { useState, useEffect } from 'react';
import './Management.css'; 

const UNIT_SIZE = 40; // 定義一個單位等於 40px
const MAX_UNITS = 256; // 最大 256 單位

const SEAT = ({API_BASE}) => {
  const [seats, setSeats] = useState([]);
  const [newSeat, setNewSeat] = useState({ seatName: '', x: 0, y: 0 });
  const [editingSeat, setEditingSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const scrollContainerRef = React.useRef(null);

const handleDragStart = (e, seatId) => {
    e.dataTransfer.setData("seatId", seatId);
    // 設置拖動時的偏移量，讓放下的位置更精準
    e.dataTransfer.setDragImage(new Image(), 0, 0); 
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const seatId = e.dataTransfer.getData("seatId");
    const rect = e.currentTarget.getBoundingClientRect();
    
    // 1. 計算在畫布上的像素位置 (考慮到滾動距離)
    const scrollLeft = e.currentTarget.scrollLeft;
    const scrollTop = e.currentTarget.scrollTop;
    
    const clientX = e.clientX - rect.left + scrollLeft;
    const clientY = e.clientY - rect.top + scrollTop;

    // 2. 轉換為「單位」：除以單位大小並四捨五入
    const unitX = Math.max(0, Math.min(MAX_UNITS, Math.round(clientX / UNIT_SIZE)));
    const unitY = Math.max(0, Math.min(MAX_UNITS, Math.round(clientY / UNIT_SIZE)));

    const seatToUpdate = seats.find(s => s.SEAT_ID === parseInt(seatId));
    if (!seatToUpdate) return;

    try {
      await fetch(`${API_BASE}/SEAT/${seatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seatName: seatToUpdate.SEAT_NAME, 
          x: unitX, 
          y: unitY 
        })
      });
      fetchSeats();
    } catch (err) {
      console.error("Update failed", err);
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingSeat ? `${API_BASE}/SEAT/${editingSeat.SEAT_ID}` : `${API_BASE}/SEAT`;
    const method = editingSeat ? 'PUT' : 'POST';
    
    // 依照資料庫結構對應欄位名稱
    const body = JSON.stringify({ 
      seatName: editingSeat ? editingSeat.SEAT_NAME : newSeat.seatName,
      x: editingSeat ? editingSeat.POSITION_X : newSeat.x,
      y: editingSeat ? editingSeat.POSITION_Y : newSeat.y
    });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!response.ok) throw new Error('Operation failed');
      setNewSeat({ seatName: '', x: 0, y: 0 });
      setEditingSeat(null);
      fetchSeats();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteSeat = async (id) => {
    if (!window.confirm('Are you sure?')) return;
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
    <div className="container" style={{ maxWidth: '900px' }}> {/* 增加寬度以容納地圖 */}
      <h1>SEAT Management</h1>
      
      {error && <div className="error-message">{error}</div>}

      <div className="management-layout">
        {/* 左側：表單 */}
        <div className="form-section">
          <form onSubmit={handleSubmit} className="item-form">
            <div className="form-group">
              <label>座位名稱:</label>
              <input type="text" value={editingSeat ? editingSeat.SEAT_NAME : newSeat.seatName} /* ... */ />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>X (單位):</label>
                <input type="number" value={editingSeat ? editingSeat.POSITION_X : newSeat.x} /* ... */ />
              </div>
              <div className="form-group">
                <label>Y (單位):</label>
                <input type="number" value={editingSeat ? editingSeat.POSITION_Y : newSeat.y} /* ... */ />
              </div>
            </div>
            <button type="submit" className="btn-primary">儲存</button>
          </form>
        </div>

        {/* 右側：2D 平面預覽圖 */}
        <div className="preview-section">
          <div 
            className="scroll-container" 
            ref={scrollContainerRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div 
              className="floor-plan-grid" 
              style={{ 
                width: `${MAX_UNITS * UNIT_SIZE}px`, 
                height: `${MAX_UNITS * UNIT_SIZE}px` 
              }}
            >
              {seats.map(seat => (
                <div 
                  key={seat.SEAT_ID}
                  className={`seat-unit ${editingSeat?.SEAT_ID === seat.SEAT_ID ? 'active' : ''}`}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, seat.SEAT_ID)}
                  style={{ 
                    left: `${seat.POSITION_X * UNIT_SIZE}px`, 
                    top: `${seat.POSITION_Y * UNIT_SIZE}px`,
                    width: `${UNIT_SIZE}px`,
                    height: `${UNIT_SIZE}px`
                  }}
                  onClick={() => setEditingSeat(seat)}
                >
                  {seat.SEAT_NAME}
                </div>
              ))}
            </div>
          </div>
          <p className="hint">使用滾輪或拖動滾動條查看 256x256 區域 (網格大小: {UNIT_SIZE}px)</p>
        </div>
      </div>

      <h2>Seats List</h2>
      {loading ? <p>Loading...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Seat Name</th>
              <th>X / Y</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {seats.map(seat => (
              <tr key={seat.SEAT_ID}>
                <td>{seat.SEAT_ID}</td>
                <td><strong>{seat.SEAT_NAME}</strong></td>
                <td>{seat.POSITION_X} / {seat.POSITION_Y}</td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => setEditingSeat(seat)} className="btn-primary" style={{ padding: '4px 8px' }}>Edit</button>
                  <button onClick={() => deleteSeat(seat.SEAT_ID)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SEAT;