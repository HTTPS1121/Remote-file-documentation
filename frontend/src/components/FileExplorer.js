import React, { useEffect, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function FileExplorer({ currentPath, onPathChange, onError, user }) {
  const [directories, setDirectories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadDirectories();
    }
  }, [currentPath, user]);

  const loadDirectories = async () => {
    const token = window.getStoredToken();
    if (!token) {
      window.handleLogout();
      return;
    }

    try {
      const makeRequest = async () => {
        const response = await fetch(`${API_URL}/list-directories`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ path: currentPath })
        });

        if (!response.ok) {
          if (response.status === 401) {
            const data = await response.json();
            if (data.code === 'TOKEN_EXPIRED' || data.code === 'TOKEN_EXPIRING_SOON' || data.code === 'INVALID_TOKEN') {
              const refreshResult = await window.refreshToken();
              if (refreshResult) {
                return makeRequest();
              }
            }
            window.handleLogout();
            return;
          }
          throw new Error('Failed to load directories');
        }
        
        const data = await window.handleResponse(response);
        if (data.error) throw new Error(data.error);
        setDirectories(data.directories);
        setError(null);
      };

      await makeRequest();
    } catch (err) {
      setError(err.message);
      setDirectories([]);
      onError?.(err.message);
    }
  };

  return (
    <div className="directories-wrapper">
      <div className="directories-list">
        {error ? (
          <div className="error-message">{error}</div>
        ) : directories.length === 0 ? (
          <div className="empty-message">אין תיקיות</div>
        ) : (
          directories.map(dir => (
            <div
              key={dir}
              className="directory-item"
              onClick={() => onPathChange(`${currentPath}\\${dir}`)}
            >
              <span className="directory-icon">📁</span>
              <span className="directory-name">{dir}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FileExplorer; 