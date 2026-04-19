import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = ({ products = [] }) => {
  const [salesData, setSalesData] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const txns = querySnapshot.docs.map(doc => doc.data());

        let revenue = 0;
        const daily = {};
        const stockMap = {};

        txns.forEach(t => {
          if (t.type === 'OUT') {
            revenue += t.total;
            if (!daily[t.date]) daily[t.date] = 0;
            daily[t.date] += t.total;
          }
          
          if (!stockMap[t.sku]) stockMap[t.sku] = 0;
          if (t.type === 'IN') stockMap[t.sku] += t.qty;
          if (t.type === 'OUT') stockMap[t.sku] -= t.qty;
        });

        const chartData = Object.keys(daily).map(date => ({
          date: date.substring(0, 5), 
          sales: daily[date]
        })).slice(-7); 

        const lowStocks = products.map(p => ({
          ...p,
          currentStock: stockMap[p.sku] || 0
        })).filter(p => p.currentStock <= 10);

        setSalesData(chartData);
        setLowStockItems(lowStocks);
        setTotalRevenue(revenue);
      } catch (error) {
        console.error("Analytics Error: ", error);
      }
    };

    fetchAnalytics();
  }, [products]);

  const fmt = (num) => Number(num).toLocaleString('en-PH', { minimumFractionDigits: 2 });

  return (
    <div>
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--green)' }}>
          <div style={{ color: 'var(--text2)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total All-Time Revenue</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginTop: '8px' }}>₱{fmt(totalRevenue)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ color: 'var(--text2)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Registered Products</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginTop: '8px' }}>{products.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ color: 'var(--text2)', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>Items Needing Reorder</div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginTop: '8px' }}>{lowStockItems.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Sales Chart */}
        <div className="card">
          <div className="card-title">Last 7 Days Revenue Trend</div>
          <div style={{ height: '300px', width: '100%' }}>
            {/* BAG-O: Empty State Check para sa Chart */}
            {salesData.length === 0 ? (
               <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', border: '1px dashed var(--border2)', borderRadius: '8px' }}>
                 <div style={{ fontSize: '30px', marginBottom: '10px' }}>📈</div>
                 <div>No sales transactions recorded yet.</div>
                 <div style={{ fontSize: '12px' }}>Go to "New Transaction" to log your first sale.</div>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text2)" fontSize={12} />
                  <YAxis stroke="var(--text2)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--surface2)', border: 'none', borderRadius: '8px', color: 'white' }} />
                  <Bar dataKey="sales" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-title" style={{ color: 'var(--red)' }}>⚠️ Low Stock Alerts</div>
          <div style={{ overflowY: 'auto', maxHeight: '300px', paddingRight: '10px' }}>
            {lowStockItems.length === 0 ? (
              <div style={{ color: 'var(--green)', textAlign: 'center', marginTop: '50px', fontWeight: 'bold' }}>🎉 All stocks are healthy!</div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.sku} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{item.sku}</div>
                  </div>
                  <div style={{ color: item.currentStock <= 0 ? 'var(--red)' : 'var(--yellow)', fontWeight: 'bold', background: 'var(--bg)', padding: '4px 8px', borderRadius: '4px', height: 'fit-content' }}>
                    {item.currentStock} left
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;