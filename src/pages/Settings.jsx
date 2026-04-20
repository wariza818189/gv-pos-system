import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const Settings = () => {
  const [config, setConfig] = useState({
    vatRate: 12,
    siTopOffset: 0,
    siLeftOffset: 0,
    drTopOffset: 0,
    drLeftOffset: 0
  });

  const [loading, setLoading] = useState(false);

  // Kuhaa ang current settings inig load
  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      }
    };
    fetchConfig();
  }, []);

  // I-save sa Firebase
  const handleSave = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'config'), {
        vatRate: Number(config.vatRate || 0),
        siTopOffset: Number(config.siTopOffset || 0),
        siLeftOffset: Number(config.siLeftOffset || 0),
        drTopOffset: Number(config.drTopOffset || 0),
        drLeftOffset: Number(config.drLeftOffset || 0)
      });
      alert("Configuration Saved!");
    } catch (error) {
      console.error(error);
      alert("Error saving settings.");
    }
    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '20px' }}>⚙️ SYSTEM CONFIGURATION</h2>
      
      {/* VAT Rate Dropdown */}
      <div style={{ marginBottom: '25px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase' }}>Default VAT Rate (%)</label>
        <select 
          value={config.vatRate} 
          onChange={(e) => setConfig({ ...config, vatRate: Number(e.target.value) })}
          style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px', marginTop: '5px', cursor: 'pointer' }}
        >
          <option value="0">0% Non-VAT / Exempt</option>
          <option value="5">5% Special Rate</option>
          <option value="12">12% Standard VAT</option>
        </select>
      </div>

      <hr style={{ borderColor: 'var(--border)', margin: '20px 0' }} />

      {/* Sales Invoice (SI) Offsets */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>📄 Sales Invoice (SI) Layout Adjustments (mm)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Top Offset (+/-)</label>
            <input 
              type="number" 
              value={config.siTopOffset} 
              onChange={(e) => setConfig({ ...config, siTopOffset: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', marginTop: '5px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Left Offset (+/-)</label>
            <input 
              type="number" 
              value={config.siLeftOffset} 
              onChange={(e) => setConfig({ ...config, siLeftOffset: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', marginTop: '5px' }}
            />
          </div>
        </div>
      </div>

      <hr style={{ borderColor: 'var(--border)', margin: '20px 0' }} />

      {/* Delivery Receipt (DR) Offsets */}
      <div style={{ marginBottom: '25px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>🚚 Delivery Receipt (DR) Layout Adjustments (mm)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Top Offset (+/-)</label>
            <input 
              type="number" 
              value={config.drTopOffset} 
              onChange={(e) => setConfig({ ...config, drTopOffset: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', marginTop: '5px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text3)' }}>Left Offset (+/-)</label>
            <input 
              type="number" 
              value={config.drLeftOffset} 
              onChange={(e) => setConfig({ ...config, drLeftOffset: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', marginTop: '5px' }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleSave} 
        disabled={loading}
        style={{ width: '100%', padding: '15px', background: '#2ecc71', color: '#1a1a2e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'SAVING...' : '💾 SAVE CONFIGURATION'}
      </button>
    </div>
  );
};

export default Settings;