import React, { useState, useEffect } from 'react';
import './Management.css';

const Home = ({ API_BASE }) => {
    const [summary, setSummary] = useState({ revenue: 0, pending: 0, totalOrders: 0 });
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const fetchBusinessStatus = async () => {
            try {
                const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${today}`);

                // 1. 先檢查 Response 是否成功 (200-299)
                if (!response.ok) {
                    // 如果是 401 或 500，這裡會捕捉到
                    console.error(`伺服器回傳錯誤代碼: ${response.status}`);
                    return;
                }

                const data = await response.json();

                // 2. 檢查回傳的是否真的是陣列
                if (!Array.isArray(data)) {
                    console.error("API 回傳格式錯誤，預期應為陣列，但收到：", data);
                    return;
                }

                // 3. 確保資料存在後才進行計算
                const uniqueOrders = [...new Set(data.map(item => item.ORDER_ID))];

                const dailyRevenue = data.reduce((acc, curr) => {
                    // 這裡同時修復 NaN 的問題：確保欄位名稱正確且為數字
                    const price = Number(curr.PRICE_AT_SALE || 0);
                    const qty = Number(curr.QUANTITY || 0);
                    return acc + (price * qty);
                }, 0);

                const pendingCount = data.filter(item => item.ITEM_SEND === 0).length;

                setSummary({
                    revenue: dailyRevenue,
                    pending: pendingCount,
                    totalOrders: uniqueOrders.length
                });
            } catch (err) {
                console.error("無法讀取營業狀況 (網路或連線問題):", err);
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