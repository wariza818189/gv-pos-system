import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const POS = ({ products }) => {
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [config, setConfig] = useState({ vatRate: 12, siTopOffset: 0, siLeftOffset: 0, drTopOffset: 0, drLeftOffset: 0 });
  
  // BAG-O: State para sa Payment Terms
  const [terms, setTerms] = useState('Cash');

  useEffect(() => {
    const configRef = doc(db, 'settings', 'config');
    const unsubConfig = onSnapshot(configRef, (docSnap) => {
      if (docSnap.exists()) setConfig(docSnap.data());
    });

    const fetchCustomers = async () => {
      try {
        const custSnapshot = await getDocs(collection(db, 'customers'));
        setCustomers(custSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    
    fetchCustomers();
    return () => unsubConfig();
  }, []);

  const activeTier = selectedCustomer?.priceTier || 'MS';

  const getPrices = (product) => {
    if (activeTier === 'ME') {
      return { casePrice: product.mePriceCase || 0, piecePrice: product.mePricePiece || 0 };
    }
    return { casePrice: product.msPriceCase || 0, piecePrice: product.msPricePiece || 0 };
  };

  const addToCart = (product, sellType) => {
    if (!selectedCustomer) return alert("BODEGA POLICY: Palihug pag-select og kustomer una ka mag-punch!");

    const prices = getPrices(product);
    const price = sellType === 'Case' ? prices.casePrice : prices.piecePrice;
    const unit = sellType === 'Case' ? 'Cs' : 'Pcs';
    const cartItemId = `${product.id}-${sellType}`; 

    const existing = cart.find(item => item.cartItemId === cartItemId);
    if (existing) {
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, cartItemId, sellType, unit, price, quantity: 1 }]);
    }
  };

  const removeFromCart = (cartItemId) => setCart(cart.filter(item => item.cartItemId !== cartItemId));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = Number(config.vatRate || 0);
  const vatAmount = subtotal - (subtotal / (1 + (vatRate / 100)));
  const netOfVat = subtotal - vatAmount;
  const total = subtotal;

  const fmt = (num) => Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // PRINTING: SALES INVOICE (SI)
  const printSI = () => {
    if (cart.length === 0) return alert("Butangi sa og items ang cart!");
    if (!selectedCustomer) return alert("Pag-select og Customer!");
    
    const siTop = Number(config.siTopOffset || 0);
    const siLeft = Number(config.siLeftOffset || 0);
    const d = new Date();
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    let content = `<div style="position: relative; width: 216mm; height: 279mm; font-family: Arial, sans-serif; font-size: 10pt; color: black;">`;
    
    content += `<div class="data" style="top: ${49 + siTop}mm; left: ${38 + siLeft}mm;">${selectedCustomer.name}</div>`;
    content += `<div class="data" style="top: ${49 + siTop}mm; left: ${160 + siLeft}mm;">${dateStr}</div>`;
    content += `<div class="data" style="top: ${55 + siTop}mm; left: ${38 + siLeft}mm;">${selectedCustomer.address || ''}</div>`;
    
    // I-print ang Terms sa resibo
    content += `<div class="data" style="top: ${55 + siTop}mm; left: ${160 + siLeft}mm; font-size: 9pt;">Terms: ${terms}</div>`;

    cart.forEach((item, index) => {
      const rowTop = 85 + (index * 5) + siTop; 
      content += `<div class="data" style="top: ${rowTop}mm; left: ${13 + siLeft}mm; width: 85mm; white-space: nowrap; overflow: hidden;">${item.name}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${102 + siLeft}mm;">${item.variant || item.size || ''}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${132 + siLeft}mm;">${item.quantity} ${item.unit}</div>`; 
      content += `<div class="data" style="top: ${rowTop}mm; left: ${155 + siLeft}mm; width: 20mm; text-align: right;">${fmt(item.price)}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${180 + siLeft}mm; width: 22mm; text-align: right;">${fmt(item.quantity * item.price)}</div>`;
    });

    content += `<div class="data" style="top: ${219 + siTop}mm; left: ${180 + siLeft}mm; width: 22mm; text-align: right;">${fmt(subtotal)}</div>`; 
    content += `<div class="data" style="top: ${224 + siTop}mm; left: ${155 + siLeft}mm; width: 20mm; text-align: center;">${vatRate}%</div>`; 
    content += `<div class="data" style="top: ${224 + siTop}mm; left: ${180 + siLeft}mm; width: 22mm; text-align: right;">${fmt(vatAmount)}</div>`;
    content += `<div class="data" style="top: ${229 + siTop}mm; left: ${180 + siLeft}mm; width: 22mm; text-align: right;">${fmt(netOfVat)}</div>`;
    content += `<div class="data" style="top: ${240 + siTop}mm; left: ${180 + siLeft}mm; width: 22mm; text-align: right; font-size: 11pt; font-weight: bold;">${fmt(total)}</div>`;
    
    content += `</div>`;
    executePrint(content);
  };

  // PRINTING: DELIVERY RECEIPT (DR)
  const printDR = () => {
    if (cart.length === 0) return alert("Butangi sa og items ang cart!");
    if (!selectedCustomer) return alert("Pag-select og Customer!");

    const drTop = Number(config.drTopOffset || 0);
    const drLeft = Number(config.drLeftOffset || 0);
    const d = new Date();
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;

    let content = `<div style="position: relative; width: 216mm; height: 279mm; font-family: Arial, sans-serif; font-size: 10pt; color: black;">`;
    
    content += `<div class="data" style="top: ${49 + drTop}mm; left: ${38 + drLeft}mm;">${selectedCustomer.name}</div>`;
    content += `<div class="data" style="top: ${49 + drTop}mm; left: ${160 + drLeft}mm;">${dateStr}</div>`;
    content += `<div class="data" style="top: ${55 + drTop}mm; left: ${38 + drLeft}mm;">${selectedCustomer.address || ''}</div>`;
    content += `<div class="data" style="top: ${55 + drTop}mm; left: ${160 + drLeft}mm; font-size: 9pt;">Terms: ${terms}</div>`;

    cart.forEach((item, index) => {
      const rowTop = 85 + (index * 5) + drTop;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${13 + drLeft}mm; width: 85mm; white-space: nowrap; overflow: hidden;">${item.name}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${102 + drLeft}mm;">${item.variant || item.size || ''}</div>`;
      content += `<div class="data" style="top: ${rowTop}mm; left: ${132 + drLeft}mm;">${item.quantity} ${item.unit}</div>`;
    });

    content += `</div>`;
    executePrint(content);
  };

  const executePrint = (htmlContent) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Preview - EDITABLE</title>
          <style>
            @media print { @page { margin: 0; } body { margin: 0; -webkit-print-color-adjust: exact; } .no-print { display: none !important; } }
            body { background: #525659; display: flex; justify-content: center; padding: 20px; font-family: Arial, sans-serif; }
            .page-wrapper { background: white; box-shadow: 0 0 15px rgba(0,0,0,0.5); position: relative; }
            .data { position: absolute; }
            .data:hover { outline: 1px dashed blue; cursor: text; background: rgba(173, 216, 230, 0.3); }
            .print-btn-container { position: fixed; top: 20px; right: 20px; z-index: 1000; text-align: right; }
            .print-btn { background: #4CAF50; color: white; padding: 15px 30px; font-size: 16px; font-weight: bold; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
            .print-btn:hover { background: #45a049; }
          </style>
        </head>
        <body>
          <div class="print-btn-container no-print">
            <button class="print-btn" onclick="window.print()">🖨️ PRINT NOW</button>
            <p style="color: white; font-size: 12px; margin-top: 10px; text-shadow: 1px 1px 2px black;">*I-click ang text sa papel aron i-edit usa i-print.</p>
          </div>
          <div class="page-wrapper" contenteditable="true" spellcheck="false">${htmlContent}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleLogTransaction = async () => {
    if (cart.length === 0) return alert("Walay items sa cart!");
    
    // BAG-O: Logic para sa Due Date ug Status
    const isPaid = terms === 'Cash';
    let dueDate = null;
    if (terms === '30 Days') { let d = new Date(); d.setDate(d.getDate() + 30); dueDate = d; }
    if (terms === '60 Days') { let d = new Date(); d.setDate(d.getDate() + 60); dueDate = d; }

    try {
      await addDoc(collection(db, 'transactions'), {
        customer: selectedCustomer.name,
        priceTier: activeTier,
        items: cart,
        total: total,
        vatRate: vatRate,
        vatAmount: vatAmount,
        date: serverTimestamp(),
        // Gidugang nato sa database:
        terms: terms,
        paymentStatus: isPaid ? 'Paid' : 'Unpaid',
        dueDate: dueDate
      });
      alert("Na-save na sa Database!");
      setCart([]);
      setSelectedCustomer(null);
      setTerms('Cash'); // I-reset balik sa Cash
    } catch (error) {
      console.error(error);
      alert("Naay error sa pag-save.");
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
      
      {/* LEFT PANEL */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Products</h2>
          <span style={{ background: 'var(--primary)', padding: '5px 10px', borderRadius: '5px', fontSize: '12px' }}>
            Active Pricing: <b>{activeTier}</b>
          </span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {products.map(product => {
            const prices = getPrices(product);
            return (
              <div key={product.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>{product.name} {product.variant}</div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => addToCart(product, 'Case')} style={{ flex: 1, padding: '8px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>+ Case<br/>(₱{fmt(prices.casePrice)})</button>
                  <button onClick={() => addToCart(product, 'Piece')} style={{ flex: 1, padding: '8px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>+ Piece<br/>(₱{fmt(prices.piecePrice)})</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '20px' }}>Current Transaction</h2>
        
        <select value={selectedCustomer?.id || ""} onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value) || null)} style={{ width: '100%', padding: '10px', marginBottom: '20px', background: selectedCustomer ? 'var(--bg)' : '#ffcccc', color: selectedCustomer ? 'white' : 'black', border: '1px solid var(--border)', borderRadius: '5px', fontWeight: 'bold' }}>
          <option value="" disabled>--- Select Customer (Required) ---</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.priceTier})</option>)}
        </select>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', borderBottom: '1px dashed var(--border)', paddingBottom: '10px' }}>
          {cart.map(item => (
            <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: 'var(--bg)', padding: '10px', borderRadius: '5px' }}>
              <div>
                <span style={{ color: 'var(--primary)', marginRight: '10px', fontWeight: 'bold' }}>{item.quantity} {item.unit}</span>
                <span style={{ fontSize: '13px' }}>{item.name}</span>
                <div style={{ fontSize: '11px', color: 'gray', marginTop: '3px' }}>@ ₱{fmt(item.price)}/{item.unit}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>₱{fmt(item.quantity * item.price)}</span>
                <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'red', color: 'white', border: 'none', borderRadius: '3px', padding: '5px 8px', cursor: 'pointer' }}>X</button>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div style={{ color: 'gray', textAlign: 'center', marginTop: '20px' }}>Wala pay sulod ang cart.</div>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray' }}><span>Subtotal:</span><span>₱{fmt(subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'gray' }}><span>VAT ({vatRate}%):</span><span>₱{fmt(vatAmount)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', marginTop: '10px', color: 'white' }}><span>Total Due:</span><span>₱{fmt(total)}</span></div>
        </div>

        {/* BAG-O: Terms Dropdown una mag-Log */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text3)' }}>Payment Terms:</label>
          <select value={terms} onChange={e => setTerms(e.target.value)} style={{ width: '100%', padding: '10px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', marginTop: '5px', fontWeight: 'bold' }}>
            <option value="Cash">Cash (Paid)</option>
            <option value="30 Days">30 Days (Unpaid)</option>
            <option value="60 Days">60 Days (Unpaid)</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <button onClick={printSI} style={{ background: '#4CAF50', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>PRINT SI</button>
          <button onClick={printDR} style={{ background: '#2196F3', color: 'white', padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>PRINT DR</button>
        </div>
        <button onClick={handleLogTransaction} style={{ background: 'var(--primary)', color: 'white', padding: '15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>LOG TRANSACTION</button>
      </div>

    </div>
  );
};

export default POS;