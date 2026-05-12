import React, { useState, useEffect } from 'react';

const Home = ({ API_BASE }) => {
    const [summary, setSummary] = useState({ revenue: 0, pending: 0, totalOrders: 0 });
    // 新增：儲存今日商品銷售統計
    const [itemSales, setItemSales] = useState([]);
    const today = new Date().toLocaleDateString('sv-SE').split('T')[0];

    useEffect(() => {
        const fetchBusinessData = async () => {
            try {
                // 1. 抓取營業額概要資料
                const summaryRes = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${today}`);
                const summaryData = await summaryRes.json();

                if (Array.isArray(summaryData)) {
                    const uniqueOrders = [...new Set(summaryData.map(item => item.ORDER_ID))];
                    const dailyRevenue = summaryData.reduce((acc, curr) => {
                        const price = Number(curr.PRICE_AT_SALE) || 0;
                        const qty = Number(curr.QUANTITY) || 0;
                        return acc + (price * qty);
                    }, 0);
                    const pendingCount = summaryData.filter(item => item.SEND === 0).length;

                    setSummary({
                        revenue: dailyRevenue,
                        pending: pendingCount,
                        totalOrders: uniqueOrders.length
                    });
                }

                // 2. 抓取今日每樣商品售出數量 (呼叫新 API)
                // 這裡將 startDate 與 endDate 都設為 today 即可取得今日統計
                const salesRes = await fetch(`${API_BASE}/GetEachItem?startDate=${today}&endDate=${today}`);
                const salesData = await salesRes.json();
                if (Array.isArray(salesData)) {
                    setItemSales(salesData);
                }

            } catch (err) {
                console.error("讀取資料失敗:", err);
            }
        };

        fetchBusinessData();
        const timer = setInterval(fetchBusinessData, 60000); // 每分鐘自動刷新
        return () => clearInterval(timer);
    }, [today, API_BASE]);

    return (
        <div className="container">
            <div className="item-form main-status-box">
                <header className="home-header">
                    <h1>營業狀況</h1>
                    <p className="home-date">今日日期：{today}</p>
                </header>

                {/* 營業狀況摘要網格 */}
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

                {/* 新增：今日商品銷售排行區域 */}
                <div className="sales-rank-section" style={{ marginTop: '30px' }}>
                    <h2 style={{ marginBottom: '15px', fontSize: '1.2rem', color: '#333' }}>今日熱銷排行</h2>
                    <div className="rank-table-container" style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '12px' }}>商品名稱</th>
                                    <th style={{ padding: '12px' }}>類別</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>銷售數量</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemSales.length > 0 ? (
                                    itemSales.map((item, index) => (
                                        <tr key={item.ITEM_ID} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{item.ITEM_NAME}</td>
                                            <td style={{ padding: '12px' }}><span className="badge">{item.Type}</span></td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#007bff' }}>
                                                {item.TOTAL_QUANTITY}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>今日暫無銷售數據</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="menu-grid">
                    {/* 未來可加入快速跳轉按鈕 */}
                </div>
            </div>
        </div>
    );
};

export default Home;