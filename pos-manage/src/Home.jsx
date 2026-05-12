import React, { useState, useEffect } from 'react';

const Home = ({ API_BASE }) => {
    const [summary, setSummary] = useState({ revenue: 0, pending: 0, totalOrders: 0 });
    // 商品銷售統計狀態
    const [eachItemSales, setEachItemSales] = useState([]);
    
    // 預設今日日期 (YYYY-MM-DD)
    const today = new Date().toLocaleDateString('sv-SE').split('T')[0];
    
    // 日期選擇器的狀態，預設為今日
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    // 1. 原有的營業狀況讀取 (每分鐘刷新)
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

    // 2. 新增：讀取每樣商品銷售統計
    const fetchEachItemSales = async () => {
        try {
            const response = await fetch(`${API_BASE}/GetEachItem?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            setEachItemSales(data);
        } catch (err) {
            console.error("無法讀取商品銷售統計:", err);
        }
    };

    // 當日期變更時自動抓取一次統計資料
    useEffect(() => {
        fetchEachItemSales();
    }, [startDate, endDate]);

    return (
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

                {/* --- 新增：商品銷售統計區域 (無自訂 CSS) --- */}
                <div style={{ marginTop: '40px', borderTop: '1px solid #ccc' }}>
                    <h3>商品銷售統計 (GetEachItem)</h3>
                    
                    {/* 日期選擇區 */}
                    <div>
                        <label>開始日期：</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                        
                        <label style={{ marginLeft: '10px' }}>結束日期：</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                        
                        <button style={{ marginLeft: '10px' }} onClick={fetchEachItemSales}>
                            刷新查詢
                        </button>
                    </div>

                    {/* 資料顯示表格 */}
                    <table border="1" style={{ marginTop: '20px', width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th>商品 ID</th>
                                <th>商品名稱</th>
                                <th>類型</th>
                                <th>總售出數量</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eachItemSales.length > 0 ? (
                                eachItemSales.map((item) => (
                                    <tr key={item.ITEM_ID}>
                                        <td>{item.ITEM_ID}</td>
                                        <td>{item.ITEM_NAME}</td>
                                        <td>{item.Type}</td>
                                        <td style={{ textAlign: 'right' }}>{item.TOTAL_QUANTITY}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center' }}>此區間無銷售資料</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* --- 新增區域結束 --- */}

                <div className="menu-grid">
                </div>
            </div>
        </div>
    );
};

export default Home;