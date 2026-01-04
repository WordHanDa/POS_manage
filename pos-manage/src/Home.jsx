import React, { useState, useEffect } from 'react';
import './Management.css';

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
            <div className="item-form" style={{ marginTop: '30px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>營業狀況</h1>
                <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>今日日期：{today}</p>

                {/* 營業狀況摘要卡片 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <div className="status-card" style={{ background: '#f0f5ff', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #adc6ff' }}>
                        <div style={{ color: '#1890ff', fontSize: '14px' }}>今日總營收</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#003a8c' }}>${summary.revenue.toLocaleString()}</div>
                    </div>
                    <div className="status-card" style={{ background: '#fff7e6', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #ffd591' }}>
                        <div style={{ color: '#fa8c16', fontSize: '14px' }}>今日訂單數</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#873800' }}>{summary.totalOrders} 筆</div>
                    </div>
                    <div className="status-card" style={{ background: '#fff1f0', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid #ffa39e' }}>
                        <div style={{ color: '#f5222d', fontSize: '14px' }}>待出餐項目</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#820014' }}>{summary.pending} 件</div>
                    </div>
                </div>

                {/* 功能管理選單 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                }}>
                </div>
            </div>
        </div>
    );
};

export default Home;