import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Management.css';

const Home = ({API_BASE}) => {
  const [summary, setSummary] = useState({ revenue: 0, pending: 0, totalOrders: 0 });
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchBusinessStatus = async () => {
      try {
        // 使用您現有的日期篩選 API 來取得今日數據
        const response = await fetch(`${API_BASE}/REVENUE_DETAILS_BY_DATE?date=${today}`);
        const data = await response.json();
        
        // 1. 計算今日總訂單數 (以唯一 ORDER_ID 計數)
        const uniqueOrders = [...new Set(data.map(item => item.ORDER_ID))];
        
        // 2. 計算今日總營業額 (需確保後端有傳回單價，或從訂單列表 API 取得)
        // 這裡暫以明細加總計算
        const dailyRevenue = data.reduce((acc, curr) => acc + (curr.PRICE_AT_SALE * curr.QUANTITY), 0);
        
        // 3. 計算待製作(未出餐)項目
        const pendingCount = data.filter(item => item.ITEM_SEND === 0).length;

        setSummary({
          revenue: dailyRevenue,
          pending: pendingCount,
          totalOrders: uniqueOrders.length
        });
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