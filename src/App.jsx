import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase/config.js';
import './App.css'; // Siguruha nga naa ni kung naa kay CSS

// 1. I-IMPORT ANG TANAN NIMO NGA PAGES
import Login from './pages/Login';
import POS from './pages/POS';
import Product from './pages/Product'; 
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Receivables from './pages/Receivables';

// NOTE: I-import ni kung naa na kay Dashboard ug Transactions page. 
// Kung wala pa, pwede ra ni nimo i-comment out una.
// import Dashboard from './pages/Dashboard';
// import Transactions from './pages/Transactions'; 

function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [page, setPage] = useState('POS'); // Default page nga mo-abli
  const [products, setProducts] = useState([]); // Masterlist sa products para sa POS

  // 2. CHECK KUNG KINSA ANG NAKA-LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 3. FETCH PRODUCTS (Aron naay ikapakita sa POS)
  useEffect(() => {
    if (user) {
      const fetchProducts = async () => {
        try {
          const querySnapshot = await getDocs(collection(db, 'products'));
          setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      };
      fetchProducts();
    }
  }, [user]);

  // KUNG NAG-LOAD PA ANG SYSTEM
  if (isAuthLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#1a1a2e', color: 'white', fontSize: '20px' }}>
        Nag-load ang System...
      </div>
    );
  }

  // KUNG WALAY NAKA-LOGIN, IPAGAWAS ANG LOGIN PAGE
  if (!user) {
    return <Login />;
  }

  // 4. SECURITY CHECK: Kinsa ni nga account?
  const isAdmin = user.email === 'admin@gv.com';

  // LOGOUT FUNCTION
  const handleLogout = async () => {
    if (window.confirm("Sigurado ka nga mo-logout?")) {
      await signOut(auth);
    }
  };

  // STYLING PARA SA SIDEBAR BUTTONS
  const btnStyle = (isActive) => ({
    width: '100%',
    padding: '15px',
    background: isActive ? 'var(--primary)' : 'transparent',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    fontWeight: 'bold',
    marginBottom: '5px',
    transition: '0.3s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1a1a2e', color: 'white' }}>
      
      {/* ================= SIDEBAR MENU ================= */}
      <div style={{ width: '250px', background: '#16213e', padding: '20px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a4a' }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '30px', textAlign: 'center', borderBottom: '1px solid gray', paddingBottom: '15px' }}>
          GV Cosmetics
        </h2>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', color: 'gray', marginBottom: '10px', letterSpacing: '1px' }}>MAIN MENU</div>
          
          {/* KINI MAKITA SA TANAN (Admin ug Encoder) */}
          <button onClick={() => setPage('POS')} style={btnStyle(page === 'POS')}>🛒 New Transaction</button>
          
          {/* I-uncomment ni kung naa na kay Dashboard ug Transactions page */}
          {/* <button onClick={() => setPage('Dashboard')} style={btnStyle(page === 'Dashboard')}>📊 Dashboard</button> */}
          {/* <button onClick={() => setPage('Transactions')} style={btnStyle(page === 'Transactions')}>📋 Transaction History</button> */}

          {/* KINI TAGO KUNG ENCODER ANG NAKA-LOGIN! */}
          {isAdmin && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '11px', color: '#f39c12', marginBottom: '10px', letterSpacing: '1px' }}>ADMIN CONTROLS</div>
              <button onClick={() => setPage('Product')} style={btnStyle(page === 'Product')}>📦 Products Masterlist</button>
              <button onClick={() => setPage('Customers')} style={btnStyle(page === 'Customers')}>👥 Customers List</button>
              <button onClick={() => setPage('Receivables')} style={btnStyle(page === 'Receivables')}>📒 Accounts Receivable</button>
              <button onClick={() => setPage('Settings')} style={btnStyle(page === 'Settings')}>⚙️ System Settings</button>
            </div>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid gray', paddingTop: '15px' }}>
          <div style={{ fontSize: '12px', color: 'gray', marginBottom: '10px', textAlign: 'center' }}>
            Logged in as:<br/>
            <b style={{ color: isAdmin ? '#f39c12' : '#4CAF50' }}>{user.email}</b>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ width: '100%', background: '#e74c3c', color: 'white', padding: '15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto', height: '100vh', boxSizing: 'border-box' }}>
        {page === 'POS' && <POS products={products} />}
        
        {/* Mga Admin Pages nga mo-render lang kung sila ang gi-click */}
        {isAdmin && page === 'Product' && <Product />}
        {isAdmin && page === 'Customers' && <Customers />}
        {isAdmin && page === 'Settings' && <Settings />}
        {isAdmin && page === 'Receivables' && <Receivables />}
        
        {/* I-uncomment ni kung magamit na nimo */}
        {/* {page === 'Dashboard' && <Dashboard />} */}
        {/* {page === 'Transactions' && <Transactions />} */}
      </div>

    </div>
  );
}

export default App;