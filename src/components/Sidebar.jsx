import React from 'react';

const Sidebar = ({ activePage, setPage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', section: 'Main' },
    { id: 'pos', label: 'New Transaction', icon: '🛒' },
    { id: 'transactions', label: 'Transactions', icon: '📋', section: 'Records' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'ar', label: 'Receivables', icon: '💳' },
    { id: 'customers', label: 'Customers', icon: '👥', section: 'Settings' },
    { id: 'products', label: 'Products', icon: '🏷️' },
    { id: 'stockin', label: 'Stock IN', icon: '📥' },
        
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-text">🧴 GV Cosmetics <span className="cloud-icon">☁️</span></div>
        <div className="logo-sub">Cloud POS System</div>
      </div>
      <nav className="nav">
        {menuItems.map((item, index) => (
          <React.Fragment key={item.id}>
            {item.section && <div className="nav-section">{item.section}</div>}
            <div 
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-icon">{item.icon}</span> {item.label}
            </div>
          </React.Fragment>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSiz: '11px', color: 'var(--green)' }}>● Connected to Firebase</div>
      </div>
    </div>
  );
};

export default Sidebar;