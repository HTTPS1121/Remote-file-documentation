import React, { useEffect, useState } from 'react';

function FileExplorer({ currentPath, onPathChange, onError }) {
  const [directories, setDirectories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDirectories();
  }, [currentPath]);

  const loadDirectories = async () => {
    try {
      const response = await fetch('http://localhost:5000/list-directories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentPath })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setDirectories(data.directories);
      setError(null);
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