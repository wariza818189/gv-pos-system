import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Kung success, automatic ni mo-redirect kay atong i-setup sa App.jsx
    } catch (err) {
      setError("Sayop ang Email o Password. Palihug usba.");
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#1a1a2e' }}>
      <div className="card" style={{ width: '400px', textAlign: 'center', padding: '40px 30px' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '10px' }}>GV Cosmetics</h1>
        <p style={{ color: 'gray', marginBottom: '30px' }}>Cloud POS System</p>
        
        {error && <div style={{ background: '#ffcccc', color: 'red', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            style={{ padding: '15px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '16px' }} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '15px', background: 'var(--bg)', color: 'white', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '16px' }} 
          />
          <button 
            type="submit" 
            disabled={loading}
            style={{ background: 'var(--primary)', color: 'white', padding: '15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}
          >
            {loading ? 'NAG-LOGIN...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;