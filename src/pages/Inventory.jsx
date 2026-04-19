import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const Inventory = ({ products }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Para sa Stock Card Modal
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchAndComputeStock = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const transactions = querySnapshot.docs.map(doc => doc.data());
        
        setAllTransactions(transactions);

        const stockMap = {};
        transactions.forEach(t => {
          if (!stockMap[t.sku]) stockMap[t.sku] = 0;
          if (t.type === 'IN') stockMap[t.sku] += t.qty;
          if (t.type === 'OUT') stockMap[t.sku] -= t.qty;
        });

        const updatedProducts = products.map(p => ({
          ...p,
          currentStock: stockMap[p.sku] || 0
        }));

        setInventoryData(updatedProducts);
        setLoading(false);
      } catch (error) {
        console.error("Error computing inventory: ", error);
        setLoading(false);
      }
    };
    if (products.length > 0) fetchAndComputeStock();
  }, [products]);

  const filteredInventory = inventoryData.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemHistory = (sku) => {
    return allTransactions
      .filter(t => t.sku === sku)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const fmt = (num) => Number(num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 🚀 UPGRADE 2: EXCEL / CSV EXPORT LOGIC
  const exportToCSV = () => {
    const headers = ["SKU", "Product Name", "Size", "Price/Pc", "Current Stock"];
    
    const rows = filteredInventory.map(p => [
      p.sku, 
      `"${p.name} ${p.variant ? p.variant : ''}"`, // Gi-butangan og quotes aron dili maguba ang columns kung naay comma ang ngalan
      p.size, 
      p.pricePiece, 
      p.currentStock
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Automatic nga butangan og petsa ang file name
    link.setAttribute("download", `Inventory_Report_${new Date().toLocaleDateString('en-PH').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div className="card-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
            Live Inventory Balance ({filteredInventory.length} items)
          </div>
          
          {/* BAG-O: Export Button ug Search Bar gitapad */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportToCSV} style={{ padding: '8px 15px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              📥 Export to Excel
            </button>
            <input 
              type="text" placeholder="🔍 Search product or SKU..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'white', width: '250px', outline: 'none' }}
            />
          </div>
        </div>
        
        {loading ? (
          <div style={{ padding: '30px', color: 'var(--text2)', textAlign: 'center' }}>Nag-compute sa Live Stock Balance... ⏳</div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                  <th style={{ padding: '12px 8px' }}>SKU</th>
                  <th style={{ padding: '12px 8px' }}>Product Name</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Current Stock</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((p) => (
                  <tr key={p.sku} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: 'var(--blue)' }}>{p.sku}</td>
                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{p.name} {p.variant && `- ${p.variant}`}</td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', backgroundColor: p.currentStock <= 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: p.currentStock <= 0 ? 'var(--red)' : 'var(--green)' }}>
                        {p.currentStock}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <button onClick={() => setSelectedItem(p)} style={{ padding: '6px 12px', background: 'var(--surface2)', color: 'white', border: '1px solid var(--border2)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                        📋 View Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PARA SA STOCK CARD */}
      {selectedItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '15px', marginBottom: '15px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Item Ledger: {selectedItem.sku}</div>
                <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{selectedItem.name}</div>
              </div>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border2)' }}>
                    <th style={{ padding: '8px' }}>Date</th>
                    <th style={{ padding: '8px' }}>Ref / Invoice</th>
                    <th style={{ padding: '8px' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {getItemHistory(selectedItem.sku).length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>Walay movement history kining itema.</td></tr>
                  ) : (
                    getItemHistory(selectedItem.sku).map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border2)' }}>
                        <td style={{ padding: '8px' }}>{h.date}</td>
                        <td style={{ padding: '8px', fontFamily: 'monospace' }}>{h.invoiceNo}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{ color: h.type === 'IN' ? 'var(--blue)' : 'var(--yellow)', fontWeight: 'bold' }}>{h.type}</span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: h.type === 'IN' ? 'var(--green)' : 'var(--red)' }}>
                          {h.type === 'IN' ? '+' : '-'}{h.qty}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;