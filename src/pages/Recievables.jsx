import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const Receivables = () => {
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUnpaid = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'transactions'), where('paymentStatus', '==', 'Unpaid'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // I-sort by Date (Pinakabag-o sa taas)
      data.sort((a, b) => b.date?.toMillis() - a.date?.toMillis());
      
      setUnpaidInvoices(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnpaid();
  }, []);

  const handleMarkAsPaid = async (id, customerName) => {
    if (window.confirm(`Sigurado ka nga naka-bayad na si ${customerName}?`)) {
      try {
        await updateDoc(doc(db, 'transactions', id), {
          paymentStatus: 'Paid',
          datePaid: new Date() // I-log kung kanus-a nibayad
        });
        alert("Na-update na isip PAID!");
        fetchUnpaid(); // I-refresh ang listahan
      } catch (error) {
        console.error("Error updating status:", error);
        alert("Naay error. Wala na-update.");
      }
    }
  };

  const fmt = (num) => Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString('en-US');
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>📒 Accounts Receivable</h1>
      
      <div className="card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '15px', color: '#e74c3c' }}>Unpaid Invoices (Utang)</h3>
        
        {loading ? (
          <p>Loading data...</p>
        ) : unpaidInvoices.length === 0 ? (
          <p style={{ color: 'var(--text3)' }}>Wala nay utang ang mga kustomer! Hapsay ang tanan.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '10px' }}>Date Issued</th>
                <th style={{ padding: '10px' }}>Customer</th>
                <th style={{ padding: '10px' }}>Terms</th>
                <th style={{ padding: '10px', color: '#e74c3c' }}>Due Date</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Total Amount</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {unpaidInvoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px' }}>{formatDate(inv.date)}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{inv.customer}</td>
                  <td style={{ padding: '10px' }}>{inv.terms}</td>
                  <td style={{ padding: '10px', color: '#e74c3c', fontWeight: 'bold' }}>{formatDate(inv.dueDate)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '14px' }}>₱{fmt(inv.total)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleMarkAsPaid(inv.id, inv.customer)}
                      style={{ background: '#2ecc71', color: '#1a1a2e', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      MARK AS PAID
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Receivables;