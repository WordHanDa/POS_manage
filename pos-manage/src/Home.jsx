import React, { useState, useEffect } from 'react';

const Home = ({ API_BASE }) => {
    const [summary, setSummary] = useState({ revenue: 0, pending: 0, totalOrders: 0 });
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchBusinessStatus = async () => {
            try {
                const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${today}`);
                const data = await response.json();

                if (Array.isArray(data)) {
                    // 1. 計算今日總訂單數 (以唯一 ORDER_ID 計數)
                    const uniqueOrders = [...new Set(data.map(item => item.ORDER_ID))];

                    // 2. 修正營收計算：改用 ORDER_MOUNT 欄位
                    const dailyRevenue = data.reduce((acc, curr) => {
                        // 確保使用 PRICE_AT_SALE (這是我們在 SQL 給的別名)
                        const price = Number(curr.PRICE_AT_SALE) || 0;
                        const qty = Number(curr.QUANTITY) || 0;
                        return acc + (price * qty);
                    }, 0);

                    // 3. 計算待出餐：根據你的 JSON，欄位似乎改成了 SEND
                    // 假設 SEND === 0 代表尚未出餐
                    const pendingCount = data.filter(item => item.SEND === 0).length;

                    setSummary({
                        revenue: dailyRevenue,
                        pending: pendingCount,
                        totalOrders: uniqueOrders.length
                    });
                } else {
                    console.error("回傳資料不是陣列:", data);
                }
            } catch (err) {
                console.error("無法讀取營業狀況:", err);
            }
        };

        fetchBusinessStatus();
        const timer = setInterval(fetchBusinessStatus, 60000); // 每分鐘自動刷新
        return () => clearInterval(timer);
    }, [today]);

    return (
        <div className="container">
            <div className="item-form main-status-box">
                <header className="home-header">
                    <h1>營業狀況</h1>
                    <p className="home-date">今日日期：{today}</p>
                </header>

                {/* 營業狀況摘要網格：透過 CSS 控制 RWD */}
                <div className="summary-grid">
                    {/* 營收卡片 */}
                    <div className="status-card card-revenue">
                        <div className="status-label">今日總營收</div>
                        <div className="status-value">${summary.revenue.toLocaleString()}</div>
                    </div>

                    {/* 訂單卡片 */}
                    <div className="status-card card-orders">
                        <div className="status-label">今日訂單數</div>
                        <div className="status-value">{summary.totalOrders} 筆</div>
                    </div>

                    {/* 待出餐卡片 */}
                    <div className="status-card card-pending">
                        <div className="status-label">待出餐項目</div>
                        <div className="status-value">{summary.pending} 件</div>
                    </div>
                </div>

                {/* 功能管理選單：預留擴充網格 */}
                <div className="menu-grid">
                    {/* 未來可加入快速跳轉按鈕 */}
                </div>
            </div>
        </div>
    );
};

export default Home;