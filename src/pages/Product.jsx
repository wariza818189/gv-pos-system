import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const Products = () => {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('');
  const [size, setSize] = useState('');
  const [pricePiece, setPricePiece] = useState('');
  
  // State para sa Edit
  const [editingId, setEditingId] = useState(null);

  // 1. Fetch Products gikan sa Firebase
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // I-sort by SKU
      data.sort((a, b) => a.sku.localeCompare(b.sku));
      
      setProductList(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 2. Add or Update Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!sku || !name || !pricePiece) return alert("Butangi ang SKU, Name, ug Price!");

    const productData = {
      sku: sku.toUpperCase(),
      name: name,
      variant: variant,
      size: size,
      pricePiece: parseFloat(pricePiece),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        // UPDATE EXISTING
        await updateDoc(doc(db, 'products', editingId), productData);
        alert(`Success! Na-update na ang presyo o detalye sa ${sku}.`);
      } else {
        // ADD NEW
        productData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'products'), productData);
        alert(`Success! Na-save na ang bag-ong produkto: ${name}.`);
      }
      
      clearForm();
      setLoading(true);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product: ", error);
      alert("Naay error sa pag-save.");
    }
  };

  // 3. Edit & Delete Triggers
  const handleEditClick = (p) => {
    setEditingId(p.id);
    setSku(p.sku);
    setName(p.name);
    setVariant(p.variant || '');
    setSize(p.size || '');
    setPricePiece(p.pricePiece);
  };

  const handleDelete = async (id, skuCode) => {
    const confirmDelete = window.confirm(`Sigurado ka nga papason nimo ang ${skuCode}? Maguba ang imong inventory history kung naa na ni transactions.`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      alert(`${skuCode} gipapas na sa database.`);
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert("Naay error sa pag-delete.");
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setSku(''); setName(''); setVariant(''); setSize(''); setPricePiece('');
  };

  // 4. Search Filter
  const filteredProducts = productList.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      
      {/* WALA NGA BAHIN: Add/Edit Form */}
      <div>
        <form className="card" onSubmit={handleSaveProduct} style={{ position: 'sticky', top: '0' }}>
          <div className="card-title" style={{ color: editingId ? 'var(--yellow)' : 'white' }}>
            {editingId ? '✏️ Edit Product' : '➕ Add New Product'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Product SKU *</label>
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} required disabled={editingId !== null} style={{ width: '100%', padding: '10px', marginTop: '4px', background: editingId ? 'rgba(255,255,255,0.1)' : 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} placeholder="e.g. AL-001" />
              {editingId && <span style={{ fontSize: '10px', color: 'var(--text3)' }}>Dili ma-usab ang SKU kung naka-save na.</span>}
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Product Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} placeholder="e.g. Michael Isopropyl Rubbing Alcohol" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Variant/Color</label>
                <input type="text" value={variant} onChange={(e) => setVariant(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} placeholder="e.g. Green 70%" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Size</label>
                <input type="text" value={size} onChange={(e) => setSize(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} placeholder="e.g. 90ml" />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Selling Price (₱) *</label>
              <input type="number" step="0.01" value={pricePiece} onChange={(e) => setPricePiece(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold' }} placeholder="0.00" />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: editingId ? 'var(--yellow)' : 'var(--primary)', color: editingId ? 'black' : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? '💾 Update Product' : '💾 Save Product'}
              </button>
              
              {editingId && (
                <button type="button" onClick={clearForm} style={{ padding: '12px', background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: '6px', cursor: 'pointer' }}>
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* TUO NGA BAHIN: Product List Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div className="card-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
            Product Master List ({filteredProducts.length})
          </div>
          
          <input 
            type="text" 
            placeholder="🔍 Search product or SKU..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'white', width: '250px', outline: 'none' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', color: 'var(--text2)' }}>Loading products... ⏳</div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                  <th style={{ padding: '12px 8px' }}>SKU</th>
                  <th style={{ padding: '12px 8px' }}>Product Details</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Price/Pc</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>Wala makit-i nga produkto.</td></tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 'bold', fontFamily: 'monospace', color: 'var(--primary)' }}>{p.sku}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <div style={{ fontWeight: '500' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
                          {p.variant && `${p.variant} | `} {p.size && `${p.size}`}
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: 'var(--green)' }}>
                        ₱{Number(p.pricePiece).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button onClick={() => handleEditClick(p)} style={{ padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--yellow)', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(p.id, p.sku)} style={{ padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--red)', borderRadius: '4px', cursor: 'pointer' }}>
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Products;