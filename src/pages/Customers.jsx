import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Gidugang ang updateDoc ug deleteDoc

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [tin, setTin] = useState('');
  const [terms, setTerms] = useState('30DAYS');
  const [contact, setContact] = useState('');
  const [accountNo, setAccountNo] = useState('');

  // BAG-O: State para sa Edit ug Search
  const [editingId, setEditingId] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'customers'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCustomers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // BAG-O: Gi-usa na ang Add ug Update nga logic
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!name) return alert("Kinahanglan butangan og ngalan ang kustomer!");

    const customerData = {
      name: name.toUpperCase(),
      address: address,
      tin: tin,
      terms: terms,
      contact: contact,
      accountNo: accountNo,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingId) {
        // KUNG NAG-EDIT: I-update ang existing nga document
        const customerRef = doc(db, 'customers', editingId);
        await updateDoc(customerRef, customerData);
        alert(`Success! Na-update na ang detalye ni ${name.toUpperCase()}.`);
      } else {
        // KUNG BAG-O: I-add as new document
        customerData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'customers'), customerData);
        alert(`Success! Na-save na si ${name.toUpperCase()} sa database.`);
      }
      
      // I-clear ang form ug i-reset ang editing mode
      clearForm();
      
      // I-refresh ang table
      setLoading(true);
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer: ", error);
      alert("Naay error sa pag-save.");
    }
  };

  // BAG-O: Logic inig click sa Edit button
  const handleEditClick = (c) => {
    setEditingId(c.id);
    setName(c.name);
    setAddress(c.address);
    setTin(c.tin);
    setTerms(c.terms);
    setContact(c.contact);
    setAccountNo(c.accountNo || '');
  };

  // BAG-O: Logic inig click sa Delete button
  const handleDelete = async (id, customerName) => {
    // Mangayo ta og confirmation sa user una papason
    const confirmDelete = window.confirm(`Sigurado ka nga papason nimo si ${customerName}? Dili na ni mabalik.`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'customers', id));
      alert(`${customerName} gipapas na sa database.`);
      fetchCustomers(); // Refresh table
    } catch (error) {
      console.error("Error deleting customer: ", error);
      alert("Naay error sa pag-delete.");
    }
  };

  // Helper para limpyo ang form
  const clearForm = () => {
    setEditingId(null);
    setName(''); setAddress(''); setTin(''); setTerms('30DAYS'); setContact(''); setAccountNo('');
  };

  // BAG-O: Filter logic para sa Search Bar
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.tin && c.tin.includes(searchQuery))
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
      
      {/* WALA NGA BAHIN: Form */}
      <div>
        <form className="card" onSubmit={handleSaveCustomer} style={{ position: 'sticky', top: '0' }}>
          {/* Usbon ang Title depende kung nag edit o nag add */}
          <div className="card-title" style={{ color: editingId ? 'var(--yellow)' : 'white' }}>
            {editingId ? '✏️ Edit Customer' : '➕ Add New Customer'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Registered Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Business Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="2" style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>TIN</label>
                <input type="text" value={tin} onChange={(e) => setTin(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div style={{ width: '100px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Terms</label>
                <input type="text" value={terms} onChange={(e) => setTerms(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Account No.</label>
                <input type="text" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Contact Person</label>
                <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} style={{ width: '100%', padding: '10px', marginTop: '4px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '12px', background: editingId ? 'var(--yellow)' : 'var(--primary)', color: editingId ? 'black' : 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? '💾 Update Customer' : '💾 Save Customer'}
              </button>
              
              {/* Ipakita lang ang Cancel button kung nag Edit */}
              {editingId && (
                <button type="button" onClick={clearForm} style={{ padding: '12px', background: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: '6px', cursor: 'pointer' }}>
                  ✕ Cancel
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* TUO NGA BAHIN: Customer List Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div className="card-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
            Customer Master List ({filteredCustomers.length})
          </div>
          
          {/* BAG-O: Search Bar */}
          <input 
            type="text" 
            placeholder="🔍 Search name or TIN..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'white', width: '250px', outline: 'none' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '20px', color: 'var(--text2)' }}>Loading customers...</div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                  <th style={{ padding: '12px 8px' }}>Customer Name</th>
                  <th style={{ padding: '12px 8px' }}>Address</th>
                  <th style={{ padding: '12px 8px' }}>Terms</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>Wala makit-i nga kustomer.</td></tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500', color: 'var(--primary)' }}>
                        {c.name}<br/>
                        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>TIN: {c.tin || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{c.address}</td>
                      <td style={{ padding: '12px 8px' }}>{c.terms}</td>
                      
                      {/* BAG-O: Action Buttons */}
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <button onClick={() => handleEditClick(c)} style={{ padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--yellow)', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' }}>
                          ✏️ Edit
                        </button>
                        <button onClick={() => handleDelete(c.id, c.name)} style={{ padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--red)', borderRadius: '4px', cursor: 'pointer' }}>
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

export default Customers;