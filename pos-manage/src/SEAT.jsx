import React, { useState, useEffect } from 'react';
import './Management.css'; 

const SEAT = ({API_BASE}) => {
  const [seats, setSeats] = useState([]);
  const [newSeat, setNewSeat] = useState({ seatName: '' });
  const [editingSeat, setEditingSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const body = JSON.stringify({ seatName: editingSeat ? editingSeat.SEAT_NAME : newSeat.seatName });

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (!response.ok) throw new Error('Operation failed');
      setNewSeat({ seatName: '' });
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
    <div className="container" style={{ maxWidth: '600px' }}> {/* 縮小寬度讓單欄更好看 */}
      <h1>SEAT Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="item-form">
        <h2>{editingSeat ? 'Edit Seat' : 'Add New Seat'}</h2>
        
        {/* 移除 form-grid 改用單獨的 form-group 使其占滿整行 */}
        <div className="form-group" style={{ marginBottom: '15px' }}>
          <label>Seat Name:</label>
          <input
            type="text"
            placeholder="e.g. Table A1"
            value={editingSeat ? editingSeat.SEAT_NAME : newSeat.seatName}
            onChange={(e) => editingSeat 
              ? setEditingSeat({ ...editingSeat, SEAT_NAME: e.target.value })
              : setNewSeat({ ...newSeat, seatName: e.target.value })
            }
            required
          />
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

      <h2>Seats List</h2>
      {loading ? <p>Loading...</p> : (
        <table className="item-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Seat Name</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {seats.map(seat => (
              <tr key={seat.SEAT_ID}>
                <td>{seat.SEAT_ID}</td>
                <td><strong>{seat.SEAT_NAME}</strong></td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => setEditingSeat(seat)} className="btn-primary" style={{ padding: '4px 8px' }}>
                    Edit
                  </button>
                  <button onClick={() => deleteSeat(seat.SEAT_ID)} className="btn-delete" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    Delete
                  </button>
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