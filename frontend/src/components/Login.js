import React, { useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהתחברות');
      }

      localStorage.setItem('rememberMe', rememberMe);
      
      if (rememberMe) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
      
      onLogin(data.user);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>התחברות למערכת</h2>
        
        <div className="form-group">
          <label>שם משתמש</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            placeholder="הכנס שם משתמש"
          />
        </div>

        <div className="form-group">
          <label>סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="הכנס סיסמה"
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            זכור אותי
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading || !username || !password}>
          {loading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
    </div>
  );
}

export default Login; 