import React, { useState, useEffect } from 'react';
import './Management.css'; 

const SEAT = ({API_BASE}) => {
  const [seats, setSeats] = useState([]);
  const [newSeat, setNewSeat] = useState({ seatName: '', x: 0, y: 0 });
  const [editingSeat, setEditingSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDragStart = (e, seatId) => {
    e.dataTransfer.setData("seatId", seatId);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    const seatId = e.dataTransfer.getData("seatId");
    const container = e.currentTarget.getBoundingClientRect();
    
    // 計算相對座標（相對於 floor-plan 容器）
    // 減去容器的左/上偏移量，並稍微修正讓滑鼠位於點位中心
    const newX = Math.round(e.clientX - container.left);
    const newY = Math.round(e.clientY - container.top);

    const seatToUpdate = seats.find(s => s.SEAT_ID === parseInt(seatId));
    if (!seatToUpdate) return;

    try {
      const response = await fetch(`${API_BASE}/SEAT/${seatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          seatName: seatToUpdate.SEAT_NAME, 
          x: newX, 
          y: newY 
        })
      });
      if (!response.ok) throw new Error('Update position failed');
      fetchSeats(); // 重新整理列表以獲取新位置
    } catch (err) {
      setError("更新位置失敗: " + err.message);
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
            <h2>{editingSeat ? 'Edit Seat' : 'Add New Seat'}</h2>
            
            <div className="form-group">
              <label>Seat Name:</label>
              <input
                type="text"
                value={editingSeat ? editingSeat.SEAT_NAME : newSeat.seatName}
                onChange={(e) => editingSeat 
                  ? setEditingSeat({ ...editingSeat, SEAT_NAME: e.target.value })
                  : setNewSeat({ ...newSeat, seatName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>X Position (px):</label>
                <input
                  type="number"
                  value={editingSeat ? editingSeat.POSITION_X : newSeat.x}
                  onChange={(e) => editingSeat 
                    ? setEditingSeat({ ...editingSeat, POSITION_X: parseInt(e.target.value) })
                    : setNewSeat({ ...newSeat, x: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="form-group">
                <label>Y Position (px):</label>
                <input
                  type="number"
                  value={editingSeat ? editingSeat.POSITION_Y : newSeat.y}
                  onChange={(e) => editingSeat 
                    ? setEditingSeat({ ...editingSeat, POSITION_Y: parseInt(e.target.value) })
                    : setNewSeat({ ...newSeat, y: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="button-group">
              <button type="submit" className="btn-primary">
                {editingSeat ? 'Update' : 'Add'} Seat
              </button>
              {editingSeat && (
                <button type="button" onClick={() => setEditingSeat(null)} className="btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 右側：2D 平面預覽圖 */}
        <div className="preview-section">
          <h3>2D Floor Plan (可拖動調整)</h3>
          {/* 容器增加 onDragOver 與 onDrop */}
          <div 
            className="floor-plan" 
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
          >
            {seats.map(seat => (
              <div 
                key={seat.SEAT_ID}
                className={`seat-node ${editingSeat?.SEAT_ID === seat.SEAT_ID ? 'active' : ''}`}
                style={{ 
                  left: `${seat.POSITION_X}px`, 
                  top: `${seat.POSITION_Y}px` 
                }}
                draggable="true" // 關鍵：開啟原生拖動
                onDragStart={(e) => handleDragStart(e, seat.SEAT_ID)}
                onClick={() => setEditingSeat(seat)}
              >
                {seat.SEAT_NAME}
              </div>
            ))}
          </div>
          <p className="hint">💡 直接拖動方塊可更改位置</p>
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