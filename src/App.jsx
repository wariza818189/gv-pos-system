import React, { useState, useEffect } from 'react';
import { db } from './firebase/config';
import { collection, onSnapshot } from 'firebase/firestore';

// 🚀 FIX 1: I-import ang CSS para mo-gana ang mga kolor!
import './App.css'; 

// I-import ang tanang Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Customers from './pages/Customers';
import StockIn from './pages/StockIn';
import AR from './pages/AR';
import Settings from './pages/Settings';

// 🚀 FIX 2: Siguruhon nato nga mo-match ang Import Name sa Component Name
import Transactions from './pages/Transaction'; // File is Transaction.jsx, Component is Transactions
import Products from './pages/Product';       // File is Product.jsx, Component is Products

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // REAL-TIME FETCH: Mokuha sa products list
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'white', fontFamily: 'Inter, sans-serif' }}>
      
      {/* --- SIDEBAR MENU --- */}
      <aside style={{ width: '260px', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '25px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🧴</span> GV Cosmetics
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '5px', letterSpacing: '1px' }}>CLOUD POS SYSTEM</div>
        </div>

        <nav style={{ flex: 1, padding: '20px 15px', display: 'flex', flexDirection: 'column', gap: '5px', overflowY: 'auto' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', margin: '15px 0 5px 10px', fontWeight: 'bold' }}>MAIN</div>
          <NavItem active={activePage === 'dashboard'} onClick={() => setActivePage('dashboard')} icon="📊" label="Dashboard" />
          <NavItem active={activePage === 'pos'} onClick={() => setActivePage('pos')} icon="🛒" label="New Transaction" />

          <div style={{ fontSize: '11px', color: 'var(--text3)', margin: '20px 0 5px 10px', fontWeight: 'bold' }}>RECORDS</div>
          <NavItem active={activePage === 'transactions'} onClick={() => setActivePage('transactions')} icon="📜" label="Transactions" />
          <NavItem active={activePage === 'inventory'} onClick={() => setActivePage('inventory')} icon="📦" label="Inventory" />
          <NavItem active={activePage === 'ar'} onClick={() => setActivePage('ar')} icon="💳" label="Receivables" />

          <div style={{ fontSize: '11px', color: 'var(--text3)', margin: '20px 0 5px 10px', fontWeight: 'bold' }}>SETTINGS</div>
          <NavItem active={activePage === 'customers'} onClick={() => setActivePage('customers')} icon="👥" label="Customers" />
          <NavItem active={activePage === 'products'} onClick={() => setActivePage('products')} icon="🏷️" label="Products" />
          <NavItem active={activePage === 'stockin'} onClick={() => setActivePage('stockin')} icon="📥" label="Stock IN" />
          <NavItem active={activePage === 'settings'} onClick={() => setActivePage('settings')} icon="⚙️" label="System Settings" />
        </nav>

        <div style={{ padding: '15px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--green)', textAlign: 'center' }}>
          ● Connected to Firebase
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '30px', height: '100vh', overflowY: 'auto' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', textTransform: 'capitalize' }}>
            {activePage.replace('-', ' ')}
          </h1>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text2)' }}>Initializing System... ⏳</div>
        ) : (
          <div className="page-container">
            {activePage === 'dashboard' && <Dashboard products={products} />}
            {activePage === 'inventory' && <Inventory products={products} />}
            
            {/* 🚀 MAGIC FIX: Perminte naka-load ang POS pero tago-on lang nato kung dili siya ang active page aron ma-save ang imong gi-type! */}
            <div style={{ display: activePage === 'pos' ? 'block' : 'none' }}>
              <POS products={products} />
            </div>

            {activePage === 'transactions' && <Transactions />}
            {activePage === 'customers' && <Customers />}
            {activePage === 'products' && <Products />}
            {activePage === 'stockin' && <StockIn products={products} />}
            {activePage === 'ar' && <AR />}
            {activePage === 'settings' && <Settings />}
          </div>
        )}
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon, label }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
      background: active ? 'var(--primary)' : 'transparent', color: active ? 'white' : 'var(--text2)', fontWeight: active ? 'bold' : 'normal',
    }}
  >
    <span style={{ fontSize: '18px' }}>{icon}</span>
    <span>{label}</span>
  </div>
);

export default App;

// Fix para sa Vercel