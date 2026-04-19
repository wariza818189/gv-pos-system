import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [vatRate, setVatRate] = useState(12);
  // SI Offsets
  const [siTop, setSiTop] = useState(0);
  const [siLeft, setSiLeft] = useState(0);
  // DR Offsets
  const [drTop, setDrTop] = useState(0);
  const [drLeft, setDrLeft] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setVatRate(data.vatRate || 12);
        setSiTop(data.siTop || 0);
        setSiLeft(data.siLeft || 0);
        setDrTop(data.drTop || 0);
        setDrLeft(data.drLeft || 0);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        vatRate, siTop, siLeft, drTop, drLeft
      });
      alert("Settings saved successfully! Ready na ang imong layouts.");
    } catch (error) {
      alert("Error saving settings.");
    }
  };

  if (loading) return <div style={{ padding: '20px', color: 'white' }}>Loading settings...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card">
        <div className="card-title">⚙️ System Configuration</div>
        
        {/* VAT SETTING */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text2)' }}>Default VAT Rate (%)</label>
          <select 
            value={vatRate} 
            onChange={(e) => setVatRate(Number(e.target.value))}
            style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }}
          >
            <option value="12">12% Standard VAT</option>
            <option value="5">5% Special Rate</option>
            <option value="0">0% Non-VAT / Exempt</option>
          </select>
        </div>

        <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '20px 0' }} />

        {/* SI LAYOUT ADJUSTMENT */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>📄 Sales Invoice (SI) Layout Adjustments (mm)</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Top Offset (+/-)</label>
              <input type="number" value={siTop} onChange={(e) => setSiTop(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginTop: '5px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Left Offset (+/-)</label>
              <input type="number" value={siLeft} onChange={(e) => setSiLeft(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginTop: '5px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
            </div>
          </div>
        </div>

        {/* DR LAYOUT ADJUSTMENT */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>🚚 Delivery Receipt (DR) Layout Adjustments (mm)</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Top Offset (+/-)</label>
              <input type="number" value={drTop} onChange={(e) => setDrTop(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginTop: '5px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Left Offset (+/-)</label>
              <input type="number" value={drLeft} onChange={(e) => setDrLeft(Number(e.target.value))} style={{ width: '100%', padding: '10px', marginTop: '5px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '6px' }} />
            </div>
          </div>
        </div>

        <button onClick={saveSettings} style={{ width: '100%', padding: '15px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          💾 SAVE CONFIGURATION
        </button>
      </div>
    </div>
  );
};

export default Settings;