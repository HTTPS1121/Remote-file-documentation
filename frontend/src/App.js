import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import FileExplorer from './components/FileExplorer';
import FilterPanel from './components/FilterPanel';
import DocumentationView from './components/DocumentationView';
import TableSettings from './components/TableSettings';
import Login from './components/Login';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ROOT_FOLDER = "C:\\";
const DEFAULT_DOWNLOADS_PATH = `C:\\Users\\${process.env.USERNAME || 'Public'}\\Downloads`;

// פונקציות גלובליות לטיפול בטוקן
window.getStoredToken = () => {
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;
  return sessionStorage.getItem('token');
};

window.refreshToken = async () => {
  try {
    console.log('Attempting to refresh token...');
    const currentToken = window.getStoredToken();
    if (!currentToken) {
      console.log('No token to refresh');
      return false;
    }

    const response = await fetch(`${API_URL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });
    
    if (!response.ok) {
      console.log('Error refreshing token:', response.status);
      const data = await response.json();
      console.log('Error details:', data);
      return false;
    }

    const data = await response.json();
    console.log('Got refresh response:', data);
    
    if (data.token) {
      // שמירת הטוקן החדש באותו מקום שבו היה הטוקן הישן
      if (localStorage.getItem('token')) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }
      console.log('Token refreshed successfully');
      return true;
    }
    
    console.log('No token in refresh response');
    return false;
  } catch (err) {
    console.error('Error refreshing token:', err);
    return false;
  }
};

window.handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  if (window.setUserState) {
    window.setUserState(null);
  }
};

window.isTokenExpiringSoon = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    console.log('אין טוקן');
    return false;
  }
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const timeUntilExpiry = expiryTime - Date.now();
    const hoursLeft = timeUntilExpiry / (1000 * 60 * 60);
    console.log(`נשארו ${hoursLeft.toFixed(2)} שעות עד לפקיעת הטוקן`);
    return timeUntilExpiry < 24 * 60 * 60 * 1000;
  } catch (err) {
    console.error('שגיאה בבדיקת תוקף הטוקן:', err);
    return false;
  }
};

window.handleResponse = async (response) => {
  const data = await response.json();
  console.log('תשובה מהשרת:', data);
  if (data.new_token) {
    console.log('התקבל טוקן חדש');
    if (localStorage.getItem('token')) {
      localStorage.setItem('token', data.new_token);
    } else {
      sessionStorage.setItem('token', data.new_token);
    }
  }
  return data;
};

function App() {
  const [defaultPath, setDefaultPath] = useState(() => {
    return localStorage.getItem('defaultPath') || DEFAULT_DOWNLOADS_PATH;
  });
  const [currentPath, setCurrentPath] = useState(defaultPath);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualPath, setManualPath] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [exportFormat, setExportFormat] = useState(() => {
    return localStorage.getItem('exportFormat') || 'jpg';
  });
  const [columnWidths, setColumnWidths] = useState(() => {
    const saved = localStorage.getItem('columnWidths');
    return saved ? JSON.parse(saved) : {
      name: 530,
      size: 107,
      duration: 102
    };
  });
  const [tableSettings, setTableSettings] = useState(() => {
    const saved = localStorage.getItem('tableSettings');
    return saved ? JSON.parse(saved) : {
      showExtensions: true,
      horizontalLineWidth: 1,
      verticalLineWidth: 1,
      borderWidth: 1,
      borderRadius: 8,
      boldParts: {
        beforeDash: false,
        afterDash: true,
        brackets: false,
        extension: false
      },
      exportPadding: 0
    };
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) return JSON.parse(savedUser);
    
    const sessionUser = sessionStorage.getItem('user');
    return sessionUser ? JSON.parse(sessionUser) : null;
  });

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [currentPath, selectedTypes, user]);

  useEffect(() => {
    localStorage.setItem('exportFormat', exportFormat);
  }, [exportFormat]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showPreview) {
        setShowPreview(false);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showPreview]);

  useEffect(() => {
    localStorage.setItem('columnWidths', JSON.stringify(columnWidths));
    
    // עדכון משתני CSS
    document.documentElement.style.setProperty('--name-width', `${columnWidths.name}px`);
    document.documentElement.style.setProperty('--size-width', `${columnWidths.size}px`);
    document.documentElement.style.setProperty('--duration-width', `${columnWidths.duration}px`);
  }, [columnWidths]);

  useEffect(() => {
    localStorage.setItem('tableSettings', JSON.stringify(tableSettings));
    
    // עדכון משתני CSS
    document.documentElement.style.setProperty('--horizontal-line-width', `${tableSettings.horizontalLineWidth}px`);
    document.documentElement.style.setProperty('--vertical-line-width', `${tableSettings.verticalLineWidth}px`);
    document.documentElement.style.setProperty('--border-width', `${tableSettings.borderWidth}px`);
    document.documentElement.style.setProperty('--border-radius', `${tableSettings.borderRadius}px`);
  }, [tableSettings]);

  useEffect(() => {
    setCurrentPath(defaultPath);
  }, [defaultPath]);

  const handleApiError = async (response) => {
    if (response.status === 401) {
      let data;
      try {
        data = await response.clone().json();
      } catch {
        console.log('Failed to parse response');
        window.handleLogout();
        return false;
      }
      
      console.log('Got 401 error with code:', data.code);
      
      // אם הטוקן לא תקין או פג תוקף, ננסה לחדש
      if (data.code === 'TOKEN_EXPIRED' || data.code === 'TOKEN_EXPIRING_SOON' || data.code === 'INVALID_TOKEN') {
        console.log('Token needs refresh, attempting...');
        const refreshResult = await window.refreshToken();
        console.log('Refresh result:', refreshResult);
        if (refreshResult) {
          return true;
        }
      }
      
      console.log('Token refresh failed or not possible, logging out');
      window.handleLogout();
      return false;
    }
    return false;
  };

  const loadFiles = async () => {
    if (!currentPath || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const makeRequest = async () => {
        const token = window.getStoredToken();
        if (!token) {
          window.handleLogout();
          return;
        }

        const response = await fetch(`${API_URL}/list-directory`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            path: currentPath,
            fileTypes: selectedTypes
          })
        });

        if (!response.ok) {
          if (response.status === 401) {
            const shouldRetry = await handleApiError(response);
            if (shouldRetry) {
              return makeRequest();
            }
            return;
          }
          throw new Error('Failed to load files');
        }
        
        const data = await handleResponse(response);
        setFiles(data.files || []);
      };

      await makeRequest();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFormat = (format) => {
    setExportFormat(format);
  };

  const generatePreview = async () => {
    const element = document.querySelector('.content-section');
    if (!element || files.length === 0) {
      setError('אין תוכן להצגה בתצוגה מקדימה');
      return;
    }

    try {
      const originalStyle = {
        height: element.style.height,
        overflow: element.style.overflow,
        maxHeight: element.style.maxHeight,
        paddingBottom: element.style.paddingBottom
      };

      element.style.height = 'auto';
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.paddingBottom = `${tableSettings.exportPadding}px`;

      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        scrollX: 0,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight,
        windowWidth: document.documentElement.offsetWidth,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.content-section');
          clonedElement.style.height = 'auto';
          clonedElement.style.overflow = 'visible';
          clonedElement.style.maxHeight = 'none';
          clonedElement.style.paddingBottom = `${tableSettings.exportPadding}px`;
          
          // הסרת הסימון הכחול מכל השורות
          clonedDoc.querySelectorAll('.file-row').forEach(row => {
            row.classList.remove('selected');
          });

          // הסרת החצים מכותרות הטבלה
          clonedDoc.querySelectorAll('.header-cell').forEach(header => {
            header.textContent = header.textContent.replace(/[↑↓]/, '').trim();
          });

          // הוספת כותרת לתצוגה מקדימה
          const headerInfo = clonedDoc.querySelector('.content-header-info');
          if (headerInfo) {
            headerInfo.style.position = 'sticky';
            headerInfo.style.top = '0';
            headerInfo.style.backgroundColor = 'white';
            headerInfo.style.zIndex = '1000';
            headerInfo.style.borderBottom = '1px solid var(--border-color)';
          }
        }
      });

      element.style.height = originalStyle.height;
      element.style.overflow = originalStyle.overflow;
      element.style.maxHeight = originalStyle.maxHeight;
      element.style.paddingBottom = originalStyle.paddingBottom;

      setPreviewImage(canvas.toDataURL(`image/${exportFormat}`, exportFormat === 'jpg' ? 0.9 : 1));
      setShowPreview(true);
    } catch (err) {
      console.error(err);
      setError('שגיאה בייצור תצוגה מקדימה');
    }
  };

  const handleDownload = () => {
    if (!previewImage) {
      generatePreview().then(() => {
        downloadFile();
      });
      return;
    }
    downloadFile();
  };

  const downloadFile = () => {
    const folderName = currentPath.split('\\').pop(); // מוציא את שם התיקייה מהנתיב
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${folderName}_${timestamp}.${exportFormat}`;

    const link = document.createElement('a');
    link.download = fileName;
    link.href = previewImage;
    link.click();
    setShowPreview(false);
  };

  const handleManualPathSubmit = (e) => {
    e.preventDefault();
    setCurrentPath(manualPath);
  };

  const handleColumnWidthChange = (column, width) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: parseInt(width)
    }));
  };

  const handleSettingsChange = (setting, value) => {
    setTableSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const generateFilteredPreview = async (fileType) => {
    const element = document.querySelector('.content-section');
    if (!element) {
      setError('אין תוכן להצגה');
      return null;
    }

    // שמירת המצב הנוכחי של הקבצים והסטיילים
    const originalFiles = [...files];
    const originalStyle = {
      height: element.style.height,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      padding: element.style.padding,
      margin: element.style.margin,
      paddingBottom: element.style.paddingBottom
    };
    
    try {
      // סינון הקבצים לפי הסוג
      const filteredFiles = files.filter(file => {
        if (fileType === 'audio') return file.type?.startsWith('audio/');
        if (fileType === 'video') return file.type?.startsWith('video/');
        return false;
      });

      if (filteredFiles.length === 0) {
        setError(`אין קבצי ${fileType === 'audio' ? 'אודיו' : 'וידאו'} בתיקייה זו`);
        return null;
      }

      // עדכון ה-state עם הקבצים המסוננים
      setFiles(filteredFiles);
      
      // המתנה לרינדור מחדש
      await new Promise(resolve => setTimeout(resolve, 100));

      // חישוב הגובה האמיתי כולל פאדינג
      const headerGroup = element.querySelector('.header-group');
      const table = element.querySelector('.content-table');
      const rows = element.querySelectorAll('.file-row');
      const rowHeight = rows.length > 0 ? rows[0].offsetHeight : 0;
      const contentHeight = headerGroup.offsetHeight + (rowHeight * rows.length);
      const totalHeight = contentHeight + tableSettings.exportPadding;

      // עדכון סטיילים לצילום
      element.style.height = `${totalHeight}px`;
      element.style.overflow = 'hidden';
      element.style.maxHeight = 'none';
      element.style.padding = '0';
      element.style.margin = '0';
      element.style.paddingBottom = `${tableSettings.exportPadding}px`;

      // יצירת התמונה
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        scrollX: 0,
        height: totalHeight,
        windowHeight: totalHeight,
        windowWidth: document.documentElement.offsetWidth,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.content-section');
          if (clonedElement) {
            clonedElement.style.height = `${totalHeight}px`;
            clonedElement.style.overflow = 'hidden';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.padding = '0';
            clonedElement.style.margin = '0';
            clonedElement.style.paddingBottom = `${tableSettings.exportPadding}px`;
            
            // ניקוי נוסף
            clonedDoc.querySelectorAll('.file-row').forEach(row => {
              row.style.marginBottom = '0';
              row.classList.remove('selected');
            });

            // עדכון הטקסט לפשוט יותר
            const headerInfo = clonedDoc.querySelector('.folder-info');
            if (headerInfo) {
              const filterIndicator = document.createElement('div');
              filterIndicator.className = 'filter-indicator';
              filterIndicator.textContent = fileType === 'audio' ? 'קבצי שמע' : 'קבצי וידאו';
              headerInfo.appendChild(filterIndicator);
            }
          }
        }
      });

      // החזרת המצב המקורי
      setFiles(originalFiles);
      Object.assign(element.style, originalStyle);

      return canvas.toDataURL(`image/${exportFormat}`, exportFormat === 'jpg' ? 0.9 : 1);
    } catch (err) {
      console.error(err);
      setError('שגיאה בייצור תצוגה מקדימה');
      // החזרת המצב המקורי במקרה של שגיאה
      setFiles(originalFiles);
      Object.assign(element.style, originalStyle);
      return null;
    }
  };

  const handleFilteredDownload = async (fileType) => {
    const folderName = currentPath.split('\\').pop();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const typeText = fileType === 'audio' ? 'אודיו' : 'וידאו';
    const fileName = `${folderName}_${typeText}_${timestamp}.${exportFormat}`;

    const imageData = await generateFilteredPreview(fileType);
    if (imageData) {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = imageData;
      link.click();
    }
  };

  const handleDefaultPathChange = (newPath) => {
    localStorage.setItem('defaultPath', newPath);
    setDefaultPath(newPath);
  };

  const hasAudioFiles = (files) => {
    return files.some(file => file.type?.startsWith('audio/'));
  };

  const hasVideoFiles = (files) => {
    return files.some(file => file.type?.startsWith('video/'));
  };

  // בדיקה תקופתית של תוקף הטוקן
  useEffect(() => {
    if (!user) return;

    const checkToken = async () => {
      if (window.isTokenExpiringSoon()) {
        await window.refreshToken();
      }
    };

    const interval = setInterval(checkToken, 60 * 60 * 1000);
    checkToken();
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    window.setUserState = setUser;
    return () => {
      window.setUserState = null;
    };
  }, []);

  const refreshFiles = async () => {
    if (!currentPath || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = window.getStoredToken();
      if (!token) {
        window.handleLogout();
        return;
      }

      const response = await fetch(`${API_URL}/list-directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          path: currentPath,
          fileTypes: selectedTypes
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          const shouldRetry = await handleApiError(response);
          if (shouldRetry) {
            return refreshFiles();
          }
          return;
        }
        throw new Error('Failed to load files');
      }
      
      const data = await handleResponse(response);
      setFiles(data.files || []);
    } catch (err) {
      setError('שגיאה בטעינת הקבצים');
      console.error('Error refreshing files:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <>
          <div className="sidebar">
            <div className="path-section">
              <div className="path-controls">
                <button onClick={window.handleLogout} className="logout-button">
                  התנתק
                </button>
                <form onSubmit={handleManualPathSubmit} className="manual-path">
                  <input
                    type="text"
                    value={manualPath}
                    onChange={(e) => setManualPath(e.target.value)}
                    placeholder="הכנס נתיב ידני"
                    dir="ltr"
                  />
                  <button 
                    type="submit" 
                    className="primary-button"
                    disabled={!manualPath.trim()}
                  >
                    עבור לנתיב
                  </button>
                </form>
                <div className="current-path" dir="ltr">{currentPath}</div>
                <button onClick={() => {
                  let parentPath = currentPath.split('\\').slice(0, -1).join('\\');

                  if (parentPath === 'C:') parentPath = ROOT_FOLDER;

                  console.log('parentPath', parentPath);

                  if (parentPath) setCurrentPath(parentPath);
                }} className="secondary-button back-button"
                disabled={currentPath === ROOT_FOLDER}
                >
                  <span className="icon">↩</span>
                  חזור אחורה
                </button>
              </div>
              <FileExplorer 
                currentPath={currentPath} 
                onPathChange={setCurrentPath} 
                user={user}
              />
            </div>
            
            <div className="filter-section">
              <FilterPanel selectedTypes={selectedTypes} onTypesChange={setSelectedTypes} />
            </div>
          </div>

          <div className="main-content">
            <div className="content-wrapper">
              <TableSettings 
                columnWidths={columnWidths}
                onWidthChange={handleColumnWidthChange}
                tableSettings={tableSettings}
                onSettingsChange={handleSettingsChange}
                exportFormat={exportFormat}
                onExportFormatChange={handleExportFormat}
                defaultPath={defaultPath}
                onDefaultPathChange={handleDefaultPathChange}
              />          
              <div className="content-table-wrapper">
                {loading ? (
                  <div className="loading">טוען...</div>
                ) : (
                  <DocumentationView 
                    files={files} 
                    currentPath={currentPath}
                    onPathChange={setCurrentPath}
                    onError={setError}
                    tableSettings={tableSettings}
                  />
                )}
              </div>
            </div>

            <div className="preview-section">
              <div className="tooltip-container">
                <button 
                  className="primary-button"
                  onClick={refreshFiles}
                  disabled={loading}
                >
                  <svg 
                    style={{ 
                      width: '20px', 
                      height: '20px',
                      fill: 'white',
                      transform: loading ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease'
                    }} 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                </button>
                <span className="tooltip">רענון רשימת הקבצים</span>
              </div>

              <div className="tooltip-container">
                <button 
                  className="primary-button"
                  onClick={generatePreview} 
                  disabled={loading || error || files.length === 0}
                >
                  הצג תצוגה מקדימה
                </button>
                <span className="tooltip">תצוגה מקדימה והורדה</span>
              </div>

              <div className="tooltip-container">
                <button 
                  className="primary-button"
                  onClick={handleDownload}
                  disabled={loading || error || files.length === 0}
                >
                  הורד
                </button>
                <span className="tooltip">שומר את התצוגה הנוכחית</span>
              </div>

              <div className="tooltip-container">
                <button 
                  className="primary-button"
                  onClick={() => handleFilteredDownload('audio')}
                  disabled={loading || error || files.length === 0 || !hasAudioFiles(files)}
                >
                  הורד תמונת אודיו
                </button>
                <span className="tooltip">שומר רק את האודיו</span>
              </div>

              <div className="tooltip-container">
                <button 
                  className="primary-button"
                  onClick={() => handleFilteredDownload('video')}
                  disabled={loading || error || files.length === 0 || !hasVideoFiles(files)}
                >
                  הורד תמונת וידאו
                </button>
                <span className="tooltip">שומר רק את הוידאו</span>
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="preview-modal" onClick={() => setShowPreview(false)}>
              <div className="preview-content" onClick={e => e.stopPropagation()}>
                <img src={previewImage} alt="תצוגה מקדימה" />
                <div className="preview-actions-fixed">
                  <button onClick={handleDownload}>הורד</button>
                  <button onClick={() => setShowPreview(false)}>סגור</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App; 