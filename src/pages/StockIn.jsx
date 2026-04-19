import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, doc, writeBatch } from 'firebase/firestore';

const StockIn = ({ products }) => {
  const [referenceNo, setReferenceNo] = useState('');
  const [supplier, setSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]); // Cart para sa mga i-stock IN

  // 1. LOGIC: Pag-filter sa Products (Search Bar)
  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.sku === product.sku);
    if (existingItem) {
      setCart(cart.map(item => item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    setSearchQuery('');
  };

  const updateQty = (sku, delta) => setCart(cart.map(item => item.sku === sku ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  const removeItem = (sku) => setCart(cart.filter(item => item.sku !== sku));

  // 2. LOGIC: Pag-save sa Firebase as "IN" Transaction
  const logStockIn = async () => {
    if (!referenceNo || cart.length === 0) {
      alert("Palihug butangi og Reference/PO No. ug at least usa ka product.");
      return;
    }

    try {
      const batch = writeBatch(db);
      const dateStr = new Date().toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' });

      cart.forEach((item) => {
        const newTxnRef = doc(collection(db, 'transactions'));
        batch.set(newTxnRef, {
          invoiceNo: referenceNo, // Gamiton natong PO/Ref number isip InvoiceNo para ma-usa ra og table
          customer: supplier ? supplier.toUpperCase() : 'SUPPLIER/STOCK-IN',
          sku: item.sku,
          description: item.name,
          type: 'IN', // KINI ANG IMPORTANTE! Para mailhan nga stock IN ni
          qty: item.qty, // Ang gidaghanon sa gi-stock in
          unit: item.unit || 'pcs',
          price: 0, // Wala tay price compute para sa Stock In sa pagkakaron
          total: 0,
          date: dateStr,
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();
      alert(`Success! Stock IN na-record na para sa Reference: ${referenceNo}`);
      
      // Clear Form
      setCart([]); setReferenceNo(''); setSupplier('');
    } catch (error) {
      alert("Naay error sa pag-save sa Stock In.");
      console.error(error);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
      
      {/* WALA NGA BAHIN: Inputs & Product Search */}
      <div>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Stock IN Details</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>PO / Reference No. *</label>
              <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} placeholder="e.g. PO-2026-001" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Supplier (Optional)</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '5px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} placeholder="e.g. MAIN WAREHOUSE" />
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="card" style={{ marginBottom: '20px', position: 'relative' }}>
          <div className="card-title">Add Items to Stock IN</div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--primary)', color: 'white', borderRadius: '6px', outline: 'none' }} placeholder="🔍 Search product to receive..." />
          {searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', zIndex: 10, marginTop: '4px', overflow: 'hidden' }}>
              {searchResults.map(p => (
                <div key={p.sku} onClick={() => addToCart(p)} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 'bold' }}>{p.name} {p.variant && `- ${p.variant}`} ({p.size})</div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{p.sku}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STOCK IN ITEMS LIST */}
        <div className="card">
          <div className="card-title">Items to Receive ({cart.length})</div>
          {cart.length === 0 ? (
            <div className="empty" style={{ padding: '30px', textAlign: 'center', color: 'var(--text2)' }}>
              <div style={{ fontSize: '30px', marginBottom: '10px' }}>📥</div>
              <div>Pangita og produkto aron idugang ang stocks.</div>
            </div>
          ) : (
            <div>
              {cart.map((item) => (
                <div key={item.sku} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{item.sku}</div>
                  </div>
                  
                  {/* QTY CONTROLS */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <label style={{ fontSize: '11px', color: 'var(--text2)' }}>Qty to Add:</label>
                    <button onClick={() => updateQty(item.sku, -1)} style={{ padding: '5px 10px', background: 'var(--surface2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>-</button>
                    {/* Imbes text lang, gihimo natong input box ang qty para kung dako ang stock in, pwede ma-type diritso */}
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCart(cart.map(i => i.sku === item.sku ? { ...i, qty: val } : i));
                      }}
                      style={{ width: '60px', padding: '5px', textAlign: 'center', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '4px' }}
                    />
                    <button onClick={() => updateQty(item.sku, 1)} style={{ padding: '5px 10px', background: 'var(--surface2)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+</button>
                  </div>
                  
                  <button onClick={() => removeItem(item.sku)} style={{ marginLeft: '15px', padding: '5px 8px', background: 'var(--red)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TUO NGA BAHIN: Summary & Submit */}
      <div>
        <div className="card" style={{ position: 'sticky', top: '20px' }}>
          <div className="card-title">Stock IN Summary</div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text2)' }}>
            <span>Total Unique Items:</span>
            <span style={{ fontWeight: 'bold', color: 'white' }}>{cart.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text2)' }}>
            <span>Total Pieces:</span>
            <span style={{ fontWeight: 'bold', color: 'white' }}>
              {cart.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={logStockIn} style={{ padding: '12px', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              📥 RECEIVE STOCKS
            </button>
            <button onClick={() => setCart([])} style={{ padding: '10px', background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: '6px', cursor: 'pointer' }}>
              🗑 Clear Form
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StockIn;