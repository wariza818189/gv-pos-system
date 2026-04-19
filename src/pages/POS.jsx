import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, doc, writeBatch, getDocs, getDoc } from 'firebase/firestore';

const POS = ({ products = [] }) => {
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentTerm, setPaymentTerm] = useState('30 DAYS'); 
  const [config, setConfig] = useState({ vatRate: 12, siTop: 0, siLeft: 0, drTop: 0, drLeft: 0 });
  const [dbCustomers, setDbCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // FETCH CONFIG & CUSTOMERS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'config'));
        if (docSnap.exists()) setConfig(docSnap.data());
        
        const custSnapshot = await getDocs(collection(db, 'customers'));
        setDbCustomers(custSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  // CALCULATIONS
  const subtotal = cart.reduce((sum, item) => sum + ((item.pricePiece || 0) * (item.qty || 0)), 0);
  const vatMultiplier = (config?.vatRate || 0) / 100;
  const netOfVat = subtotal / (1 + vatMultiplier);
  const vatAmount = subtotal - netOfVat;
  const total = subtotal;

  const fmt = (num) => Number(num || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // FORMAT DATE FUNCTION
  const getFormattedDate = () => {
    const [year, month, day] = txnDate.split('-');
    return `${month}/${day}/${year}`;
  };

  // CART LOGIC
  const addToCart = (product) => {
    const existing = cart.find(item => item.sku === product.sku);
    if (existing) {
      setCart(cart.map(item => item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1, unit: 'Pcs.' }]);
    }
    setSearchQuery('');
  };

  const updateQty = (sku, delta) => setCart(cart.map(item => item.sku === sku ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  const removeItem = (sku) => setCart(cart.filter(item => item.sku !== sku));

  // TRANSACTION LOGIC
  const logTransaction = async () => {
    const custName = selectedCustomer ? selectedCustomer.name : customerSearch;
    if (!invoiceNo || !custName || cart.length === 0) return alert("Palihug kompletoha ang detalye.");

    try {
      const batch = writeBatch(db);
      const dateStr = getFormattedDate();

      cart.forEach((item) => {
        const newRef = doc(collection(db, 'transactions'));
        batch.set(newRef, {
          invoiceNo, customer: custName.toUpperCase(), sku: item.sku, description: item.name,
          type: 'OUT', qty: item.qty, unit: item.unit || 'Pcs.', price: item.pricePiece, total: item.qty * item.pricePiece,
          date: dateStr, status: paymentTerm === 'CASH' ? 'PAID' : 'UNPAID', terms: paymentTerm,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      alert(`Success! Transaction ${invoiceNo} saved.`);
      setCart([]); setInvoiceNo(''); setCustomerSearch(''); setSelectedCustomer(null);
    } catch (err) { alert("Error saving transaction."); }
  };

  // 🖨️ PRINT SI LOGIC
  const printSI = () => {
    if (cart.length === 0) return;
    const { siTop, siLeft } = config;
    const dateStr = getFormattedDate();
    
    const printName = selectedCustomer ? selectedCustomer.name : customerSearch;
    const printAddress = selectedCustomer?.address || '';
    const printTin = selectedCustomer?.tin || '';
    const printAccountNo = selectedCustomer?.accountNo || '';
    const printContact = selectedCustomer?.contact || ''; 

    const w = window.open('', '_blank', 'width=800,height=1000');
    w.document.write(`
      <html><head><style>
        @page { margin: 0; size: Letter portrait; }
        body { font-family: Arial, sans-serif; font-size: 10pt; position: relative; margin: 0; }
        .data { position: absolute; font-weight: bold; white-space: nowrap; }
      </style></head><body>
      
      <div class="data" style="top: ${49 + siTop}mm; left: ${45 + siLeft}mm; width: 110mm;">${printName}</div>
      <div class="data" style="top: ${55 + siTop}mm; left: ${45 + siLeft}mm;">${printTin}</div>
      <div class="data" style="top: ${61 + siTop}mm; left: ${45 + siLeft}mm; width: 110mm;">${printAddress}</div>
  
      <div class="data" style="top: ${36 + siTop}mm; left: ${165 + siLeft}mm;">${dateStr}</div>
      <div class="data" style="top: ${43 + siTop}mm; left: ${165 + siLeft}mm;">${paymentTerm}</div>
      <div class="data" style="top: ${49 + siTop}mm; left: ${165 + siLeft}mm;">${printAccountNo}</div>
      <div class="data" style="top: ${55 + siTop}mm; left: ${165 + siLeft}mm;">${printContact}</div>
  
      ${cart.map((item, i) => {
        const currentTop = 83 + siTop + (i * 6.5); 
        return `
          <div class="data" style="top: ${currentTop}mm; left: ${15 + siLeft}mm; width: 85mm;">${item.name}</div>
          <div class="data" style="top: ${currentTop}mm; left: ${108 + siLeft}mm; width: 15mm; text-align: center;">${item.qty} ${item.unit}</div>
          <div class="data" style="top: ${currentTop}mm; left: ${125 + siLeft}mm; width: 20mm; text-align: right;">${fmt(item.pricePiece)}</div>
          <div class="data" style="top: ${currentTop}mm; left: ${155 + siLeft}mm; width: 25mm; text-align: right;">${fmt(item.qty * item.pricePiece)}</div>
        `;
      }).join('')}
  
      <div class="data" style="top: ${223 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right;">${fmt(subtotal)}</div>
      
      {/* KINI ANG BAG-O NGA LINYA PARA SA 5% O 12% */}
      <div class="data" style="top: ${229 + siTop}mm; left: ${140 + siLeft}mm;">${config.vatRate}%</div>
      
      <div class="data" style="top: ${229 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right;">${fmt(vatAmount)}</div>
      <div class="data" style="top: ${235 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right;">${fmt(netOfVat)}</div>
      <div class="data" style="top: ${259 + siTop}mm; left: ${165 + siLeft}mm; width: 25mm; text-align: right; font-size: 12pt;">${fmt(total)}</div>
  
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    w.document.close();
  };

  // 🖨️ PRINT DR LOGIC
  const printDR = () => {
    if (cart.length === 0) return;
    const { drTop, drLeft } = config;
    const dateStr = getFormattedDate();
    
    const printName = selectedCustomer ? selectedCustomer.name : customerSearch;
    const printAddress = selectedCustomer?.address || '';

    const w = window.open('', '_blank', 'width=800,height=1000');
    w.document.write(`
      <html><head><style>
        @page { margin: 0; size: Letter portrait; }
        body { font-family: Arial, sans-serif; font-size: 10pt; position: relative; margin: 0; }
        .data { position: absolute; font-weight: bold; }
      </style></head><body>
      
      <div class="data" style="top: ${25 + drTop}mm; left: ${40 + drLeft}mm;">${printName}</div>
      <div class="data" style="top: ${31 + drTop}mm; left: ${40 + drLeft}mm; width: 110mm;">${printAddress}</div>
      
      <div class="data" style="top: ${25 + drTop}mm; left: ${165 + drLeft}mm;">${dateStr}</div>
      <div class="data" style="top: ${31 + drTop}mm; left: ${165 + drLeft}mm;">${paymentTerm}</div>
      <div class="data" style="top: ${37 + drTop}mm; left: ${165 + drLeft}mm;">${invoiceNo}</div> 
  
      ${cart.map((item, i) => {
        const currentTop = 62 + drTop + (i * 6.5);
        return `
          <div class="data" style="top: ${currentTop}mm; left: ${20 + drLeft}mm; width: 15mm; text-align: center;">${item.qty}</div>
          <div class="data" style="top: ${currentTop}mm; left: ${38 + drLeft}mm; width: 15mm; text-align: center;">${item.unit || 'Pcs.'}</div>
          <div class="data" style="top: ${currentTop}mm; left: ${60 + drLeft}mm; width: 120mm;">${item.name}</div>
        `;
      }).join('')}
      
      <script>window.onload=()=>{window.print();window.close();}</script>
      </body></html>
    `);
    w.document.close();
  };

  // SEARCH FILTERS
  const filteredProducts = searchQuery.trim() === '' ? [] : products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  const filteredCustomers = customerSearch.trim() === '' ? [] : dbCustomers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  ).slice(0, 5);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
      <div>
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title">Transaction Details</div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Date</label>
              <input type="date" value={txnDate} onChange={e => setTxnDate(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', marginTop: '5px', colorScheme: 'dark' }} />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Invoice No.</label>
              <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', marginTop: '5px' }} placeholder="e.g. 1000801" />
            </div>

            <div style={{ flex: 2, position: 'relative' }}>
              <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Customer Name</label>
              <input type="text" value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: selectedCustomer ? '1px solid var(--green)' : '1px solid var(--border)', color: 'white', borderRadius: '8px', marginTop: '5px' }} placeholder="Search Customer..." />
              
              {selectedCustomer && (
                <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '5px' }}>
                  ✓ Auto-filled: TIN {selectedCustomer.tin || 'N/A'}
                </div>
              )}

              {!selectedCustomer && filteredCustomers.length > 0 && (
                <div style={{ position: 'absolute', width: '100%', background: 'var(--surface2)', borderRadius: '8px', zIndex: 10, marginTop: '5px', border: '1px solid var(--border2)', overflow: 'hidden' }}>
                  {filteredCustomers.map(c => <div key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); }} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>{c.name}</div>)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '20px', position: 'relative' }}>
          <div className="card-title">Add Products</div>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '14px', background: 'var(--bg)', border: '1px solid var(--primary)', color: 'white', borderRadius: '8px', outline: 'none' }} placeholder="🔍 Search SKU or Product Name..." />
          {filteredProducts.length > 0 && (
            <div style={{ position: 'absolute', width: '100%', background: 'var(--surface2)', borderRadius: '8px', zIndex: 10, marginTop: '5px', border: '1px solid var(--border2)', overflow: 'hidden' }}>
              {filteredProducts.map(p => (
                <div key={p.sku} onClick={() => addToCart(p)} style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.name} <small style={{ color: 'var(--text3)' }}>({p.sku})</small></span>
                  <span style={{ color: 'var(--green)', fontWeight: 'bold' }}>₱{fmt(p.pricePiece)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Order Items ({cart.length})</div>
          {cart.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>No items in cart.</div>
          ) : (
            cart.map(item => (
              <div key={item.sku} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.sku} | ₱{fmt(item.pricePiece)} per pc</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  
                  {/* BAG-O: Editable Quantity Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--surface2)', borderRadius: '6px', padding: '2px 5px' }}>
                    <button onClick={() => updateQty(item.sku, -1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '16px' }}>-</button>
                    
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setCart(cart.map(i => i.sku === item.sku ? { ...i, qty: val } : i));
                      }}
                      style={{ width: '45px', textAlign: 'center', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', outline: 'none', fontSize: '14px' }}
                      min="1"
                    />

                    <button onClick={() => updateQty(item.sku, 1)} style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '16px' }}>+</button>
                  </div>
                  
                  <div style={{ width: '100px', textAlign: 'right', fontWeight: 'bold' }}>₱{fmt(item.qty * item.pricePiece)}</div>
                  <button onClick={() => removeItem(item.sku)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '18px', paddingLeft: '10px' }}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ position: 'sticky', top: '0', height: 'fit-content' }}>
        <div className="card">
          <div className="card-title">Order Summary</div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Payment Terms</label>
            <select value={paymentTerm} onChange={e => setPaymentTerm(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', marginTop: '5px', cursor: 'pointer' }}>
              <option value="30 DAYS">30 DAYS (Credit)</option>
              <option value="CASH">CASH (Paid)</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)' }}><span>Subtotal (Net)</span><span>₱{fmt(netOfVat)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text2)' }}><span>VAT ({config.vatRate}%)</span><span>₱{fmt(vatAmount)}</span></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: 'white' }}>TOTAL DUE</span>
            <span style={{ fontSize: '24px', fontWeight: '900', color: 'var(--primary)' }}>₱{fmt(total)}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <button onClick={logTransaction} style={{ width: '100%', padding: '16px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>✅ LOG TRANSACTION</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={printSI} style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🖨️ Print SI</button>
              <button onClick={printDR} style={{ flex: 1, padding: '12px', background: 'var(--surface2)', color: 'white', border: '1px solid var(--border2)', borderRadius: '8px', cursor: 'pointer' }}>🖨️ Print DR</button>
            </div>
            <button onClick={() => { setCart([]); setInvoiceNo(''); setCustomerSearch(''); setSelectedCustomer(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}>Clear All Items</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;