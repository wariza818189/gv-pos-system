import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const AR = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Pag-fetch sa Data gikan sa Transactions
  const fetchAR = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 2. Logic: I-filter lang tong OUT (Sales) ug WALA pa na-bayri (status !== 'PAID')
      const unpaidSales = data.filter(t => t.type === 'OUT' && t.status !== 'PAID');

      // 3. Logic: I-grupo ang utang base sa Invoice Number
      const groupedByInvoice = {};
      unpaidSales.forEach(t => {
        const key = t.invoiceNo;
        if (!groupedByInvoice[key]) {
          groupedByInvoice[key] = {
            docIds: [], // Atong i-save ang mga ID para puhon ma-update nato as PAID
            invoiceNo: t.invoiceNo,
            date: t.date,
            customer: t.customer,
            totalDue: 0,
            items: []
          };
        }
        groupedByInvoice[key].docIds.push(t.id);
        groupedByInvoice[key].items.push(t);
        groupedByInvoice[key].totalDue += t.total;
      });

      // 4. I-sort aron mag-una ang pinakakaraan (lapas 30 days) o pinakadako
      const sortedAR = Object.values(groupedByInvoice).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setReceivables(sortedAR);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching AR: ", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAR();
  }, []);

  // 5. Logic: Pag-marka og "PAID"
  const markAsPaid = async (invoiceData) => {
    const confirmPayment = window.confirm(`Markahan nato og PAID ang Invoice ${invoiceData.invoiceNo} ni ${invoiceData.customer}?`);
    if (!confirmPayment) return;

    try {
      // I-loop ang tanang items sulod adtong resibo ug markahan og 'PAID'
      for (const id of invoiceData.docIds) {
        const txnRef = doc(db, 'transactions', id);
        await updateDoc(txnRef, { status: 'PAID', paidDate: new Date().toISOString() });
      }
      
      alert(`Success! Invoice ${invoiceData.invoiceNo} is now fully paid.`);
      setLoading(true);
      fetchAR(); // Refresh table
    } catch (error) {
      alert("Naay error sa pag-update.");
      console.error(error);
    }
  };

  // Helper function
  const fmt = (num) => Number(num).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalReceivables = receivables.reduce((sum, inv) => sum + inv.totalDue, 0);

  // Search Filter
  const filteredAR = receivables.filter(inv => 
    inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
      
      {/* WALA NGA BAHIN: AR Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div className="card-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
            Unpaid Invoices ({filteredAR.length})
          </div>
          <input 
            type="text" placeholder="🔍 Search customer or invoice..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'white', width: '250px', outline: 'none' }}
          />
        </div>
        
        {loading ? (
          <div style={{ padding: '30px', color: 'var(--text2)', textAlign: 'center' }}>Nangita og mga utang... ⏳</div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                  <th style={{ padding: '12px 8px' }}>Date</th>
                  <th style={{ padding: '12px 8px' }}>Invoice No</th>
                  <th style={{ padding: '12px 8px' }}>Customer</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount Due</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAR.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text2)' }}>🎉 Wala nay utang! All accounts paid.</td></tr>
                ) : (
                  filteredAR.map(inv => (
                    <tr key={inv.invoiceNo} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{inv.date}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 'bold' }}>{inv.invoiceNo}</td>
                      <td style={{ padding: '12px 8px', fontWeight: '500' }}>{inv.customer}</td>
                      <td style={{ padding: '12px 8px', color: 'var(--red)', fontWeight: 'bold', textAlign: 'right' }}>
                        ₱{fmt(inv.totalDue)}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <button onClick={() => markAsPaid(inv)} style={{ padding: '6px 12px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                          💵 MARK PAID
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

      {/* TUO NGA BAHIN: AR Summary */}
      <div>
        <div className="card" style={{ position: 'sticky', top: '0' }}>
          <div className="card-title">AR Summary</div>
          
          <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border2)', textAlign: 'center' }}>
            <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '8px' }}>Total Collectibles:</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--red)' }}>
              ₱{fmt(totalReceivables)}
            </div>
          </div>
          
          <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text3)', lineHeight: '1.5' }}>
            * This list shows all Sales Invoices (OUT) that have not been marked as PAID in the system.
          </div>
        </div>
      </div>

    </div>
  );
};

export default AR;