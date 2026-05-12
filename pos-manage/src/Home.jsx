import React, { useState, useEffect } from 'react';

const Home = ({ API_BASE }) => {
    const [summary, setSummary] = useState({ revenue: 0, pending: 0, totalOrders: 0 });
    const [eachItemSales, setEachItemSales] = useState([]);
    
    const today = new Date().toLocaleDateString('sv-SE').split('T')[0];
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        const fetchBusinessStatus = async () => {
            try {
                const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${today}`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    const uniqueOrders = [...new Set(data.map(item => item.ORDER_ID))];
                    const dailyRevenue = data.reduce((acc, curr) => {
                        const price = Number(curr.PRICE_AT_SALE) || 0;
                        const qty = Number(curr.QUANTITY) || 0;
                        return acc + (price * qty);
                    }, 0);
                    const pendingCount = data.filter(item => item.SEND === 0).length;

                    setSummary({
                        revenue: dailyRevenue,
                        pending: pendingCount,
                        totalOrders: uniqueOrders.length
                    });
                }
            } catch (err) {
                console.error("無法讀取營業狀況:", err);
            }
        };

        fetchBusinessStatus();
        const timer = setInterval(fetchBusinessStatus, 60000);
        return () => clearInterval(timer);
    }, [today, API_BASE]);

    const fetchEachItemSales = async () => {
        try {
            const response = await fetch(`${API_BASE}/GetEachItem?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            setEachItemSales(data);
        } catch (err) {
            console.error("無法讀取商品銷售統計:", err);
        }
    };

    useEffect(() => {
        fetchEachItemSales();
    }, [startDate, endDate]);

    return (
        <div className="main-container"> {/* 使用 CSS 中的全螢幕背景 */}
            <div className="container">
                <div className="item-form main-status-box">
                    <header className="home-header">
                        <h1>營業狀況</h1>
                        <p className="home-date">今日日期：{today}</p>
                    </header>

                    <div className="summary-grid">
                        <div className="status-card card-revenue">
                            <div className="status-label">今日總營收</div>
                            <div className="status-value">${summary.revenue.toLocaleString()}</div>
                        </div>
                        <div className="status-card card-orders">
                            <div className="status-label">今日訂單數</div>
                            <div className="status-value">{summary.totalOrders} 筆</div>
                        </div>
                        <div className="status-card card-pending">
                            <div className="status-label">待出餐項目</div>
                            <div className="status-value">{summary.pending} 件</div>
                        </div>
                    </div>

                    {/* --- 結合 Management.css 風格的商品銷售統計區域 --- */}
                    <div className="audit-detail-card" style={{ marginTop: '30px' }}>
                        <h2 style={{ color: 'var(--gold)', marginBottom: '20px', borderLeft: '4px solid var(--gold)', paddingLeft: '15px' }}>
                            商品銷售統計
                        </h2>
                        
                        {/* 日期選擇控制列 */}
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ color: 'var(--black)' }}>
                                <span style={{ marginRight: '8px' }}>區間：</span>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <span style={{ margin: '0 8px' }}>至</span>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>
                            <button 
                                onClick={fetchEachItemSales}
                                style={{
                                    padding: '6px 15px',
                                    backgroundColor: 'var(--dark-gray)',
                                    color: 'var(--gold)',
                                    border: '1px solid var(--gold)',
                                    cursor: 'pointer',
                                    borderRadius: '4px'
                                }}
                            >
                                重新查詢
                            </button>
                        </div>

                        {/* 資料列表表格 */}
                        <table className="inner-detail-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>商品名稱</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>類型</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>累計售出</th>
                                </tr>
                            </thead>
                            <tbody>
                                {eachItemSales.length > 0 ? (
                                    eachItemSales.map((item) => (
                                        <tr key={item.ITEM_ID}>
                                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.ITEM_NAME}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.9em', color: '#666' }}>{item.Type}</span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', color: 'var(--black)', fontSize: '1.2em', fontWeight: 'bold' }}>
                                                {item.TOTAL_QUANTITY} <small style={{ fontSize: '0.6em', color: '#999' }}>份</small>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                            選定區間內尚無銷售紀錄
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;