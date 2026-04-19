import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const POS = ({ products }) => {
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [config, setConfig] = useState({ vatRate: 12, siTopOffset: 0, siLeftOffset: 0, drTopOffset: 0, drLeftOffset: 0 });

  // 1. Real-time Config & Customers Fetch
  useEffect(() => {
    // Config listener para sa Settings (Automatic update sa VAT ug Offsets)
    const configRef = doc(db, 'settings', 'config');
    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    });

    // Fetch Customers
    const fetchCustomers = async () => {
      try {
        const custSnapshot = await getDocs(collection(db, 'customers'));
        setCustomers(custSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    
    fetchCustomers();
    return () => unsubConfig();
  }, []);

  // 2. Cart Functions
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  // 3. Computations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // Compute VAT base sa Settings
  const vatRate = Number(config.vatRate || 0);
  const vatAmount = subtotal - (subtotal / (1 + (vatRate / 100)));
  const netOfVat = subtotal - vatAmount;
  const total = subtotal;

  const fmt = (num) => Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 4. PRINTING: SALES INVOICE (SI)
  const printSI = () => {
    const siTop = Number(config.siTopOffset || 0);
    const siLeft = Number(config.siLeftOffset || 0);
    const d = new Date();
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    let content = `<div style="position: relative; width: 210mm; height: 297mm; font-family: Arial, sans-serif; font-size: 10pt; color: black;">`;
    
    // SI Header (Customer Info)
    content += `<div class="data" style="top: ${49 + siTop}mm; left: ${40 + siLeft}mm;">${selectedCustomer?.name || 'CASH CUSTOMER'}</div>`;
    content += `<div class="data" style="top: ${49 + siTop}mm; left: ${160 + siLeft}mm;">${dateStr}</div>`;
    content += `<div class="data" style="top: ${55 + siTop}mm; left: ${40 + siLeft}mm;">${selectedCustomer?.address || 'N/A'}</div>`;

    // SI Items (Naay Prices)
    cart.forEach((item, index) => {
      const rowTop = 85 + (index * 5) + siTop;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${20 + siLeft}mm;">${item.quantity}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${35 + siLeft}mm;">${item.unit || 'pcs'}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${60 + siLeft}mm;">${item.name}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${145 + siLeft}mm; width: 20mm; text-align: right;">${fmt(item.price)}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${170 + siLeft}mm; width: 20mm; text-align: right;">${fmt(item.quantity * item.price)}</div>`;
    });

    // SI Totals & VAT Computation
    content += `<div class="data" style="top: ${223 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right;">${fmt(subtotal)}</div>`;
    
    // KINI ANG NAKASULAT NGA VAT %
    content += `<div class="data" style="top: ${229 + siTop}mm; left: ${140 + siLeft}mm;">${vatRate}%</div>`;
    
    content += `<div class="data" style="top: ${229 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right;">${fmt(vatAmount)}</div>`;
    content += `<div class="data" style="top: ${235 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right;">${fmt(netOfVat)}</div>`;
    content += `<div class="data" style="top: ${259 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right; font-size: 12pt; font-weight: bold;">${fmt(total)}</div>`;
    
    content += `</div>`;
    executePrint(content);
  };

  // 5. PRINTING: DELIVERY RECEIPT (DR)
  const printDR = () => {
    const drTop = Number(config.drTopOffset || 0);
    const drLeft = Number(config.drLeftOffset || 0);
    const d = new Date();
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    let content = `<div style="position: relative; width: 210mm; height: 297mm; font-family: Arial, sans-serif; font-size: 10pt; color: black;">`;
    
    // DR Header
    content += `<div class="data" style="top: ${49 + drTop}mm; left: ${40 + drLeft}mm;">${selectedCustomer?.name || 'CASH CUSTOMER'}</div>`;
    content += `<div class="data" style="top: ${49 + drTop}mm; left: ${160 + drLeft}mm;">${dateStr}</div>`;
    content += `<div class="data" style="top: ${55 + drTop}mm; left: ${40 + drLeft}mm;">${selectedCustomer?.address || 'N/A'}</div>`;

    // DR Items (WLAY PRESYO, Quantity ug Description ra)
    cart.forEach((item, index) => {
      const rowTop = 85 + (index * 5) + drTop;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${20 + drLeft}mm;">${item.quantity}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${35 + drLeft}mm;">${item.unit || 'pcs'}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${60 + drLeft}mm;">${item.name}</div>`;
      // Walay pa-tuo nga alignment kay walay amount
    });

    content += `</div>`;
    executePrint(content);
  };

  // 6. Print Executor
  const executePrint = (htmlContent) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Document</title>
          <style>
            @media print { 
              @page { margin: 0; } 
              body { margin: 0; -webkit-print-color-adjust: exact; } 
            }
            .data { position: absolute; }
          </style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // 7. Log Transaction to Database
  const handleLogTransaction = async () => {
    if (cart.length === 0) return alert("Walay items sa cart!");
    try {
      await addDoc(collection(db, 'transactions'), {
        customer: selectedCustomer?.name || 'CASH',
        items: cart,
        total: total,
        vatRate: vatRate,
        vatAmount: vatAmount,
        date: serverTimestamp()
      });
      alert("Na-save na sa Database!");
      setCart([]);
    } catch (error) {
      console.error(error);
      alert("Naay error sa pag-save.");
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
      
      {/* LEFT PANEL: Products List */}
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Products</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {products.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              style={{ padding: '15px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', textAlign: 'center' }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{product.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--primary)' }}>₱{product.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Cart & Computations */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '20px' }}>Current Transaction</h2>
        
        {/* Customer Select */}
        <select 
          onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px' }}
        >
          <option value="">Select Customer (Walk-in)</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', borderBottom: '1px dashed var(--border)', paddingBottom: '10px' }}>
          {cart.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div>
                <span style={{ color: 'var(--primary)', marginRight: '10px' }}>{item.quantity}x</span>
                {item.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px' }}>₱{fmt(item.quantity * item.price)}</span>
                <button onClick={() => removeFromCart(item.id)} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '3px', padding: '2px 6px', cursor: 'pointer' }}>X</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div style={{ color: 'gray', textAlign: 'center', marginTop: '20px' }}>Wala pay gi-punch.</div>}
        </div>

        {/* Totals */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray' }}>
            <span>Subtotal:</span>
            <span>₱{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray' }}>
            <span>VAT ({vatRate}%):</span>
            <span>₱{fmt(vatAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', color: 'white' }}>
            <span>Total Due:</span>
            <span>₱{fmt(total)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <button onClick={printSI} style={{ background: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>PRINT SI</button>
          <button onClick={printDR} style={{ background: '#2196F3', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>PRINT DR</button>
        </div>
        <button onClick={handleLogTransaction} style={{ background: 'var(--primary)', color: 'white', padding: '15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
          LOG TRANSACTION
        </button>
      </div>

    </div>
  );
};

export default POS;