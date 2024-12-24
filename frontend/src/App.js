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
      borderRadius: 8
    };
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  useEffect(() => {
    loadFiles();
  }, [currentPath, selectedTypes]);

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

  const loadFiles = async () => {
    if (!currentPath) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/list-directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          path: currentPath,
          fileTypes: selectedTypes
        })
      });

      if (!response.ok) throw new Error('Failed to load files');
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading files:', err);
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
        maxHeight: element.style.maxHeight
      };

      element.style.height = 'auto';
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';

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

    // שירת המצב הנוכחי של הקבצים והסטיילים
    const originalFiles = [...files];
    const originalStyle = {
      height: element.style.height,
      overflow: element.style.overflow,
      maxHeight: element.style.maxHeight,
      padding: element.style.padding,
      margin: element.style.margin
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

      // חישוב הגובה האמיתי
      const headerGroup = element.querySelector('.header-group');
      const table = element.querySelector('.content-table');
      const rows = element.querySelectorAll('.file-row');
      const rowHeight = rows.length > 0 ? rows[0].offsetHeight : 0;
      const actualHeight = headerGroup.offsetHeight + (rowHeight * rows.length);

      // עדכון סטיילים לצילום
      element.style.height = `${actualHeight}px`;
      element.style.overflow = 'hidden';
      element.style.maxHeight = 'none';
      element.style.padding = '0';
      element.style.margin = '0';

      // יצירת התמונה
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2,
        scrollX: 0,
        height: actualHeight,
        windowHeight: actualHeight,
        windowWidth: document.documentElement.offsetWidth,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.content-section');
          if (clonedElement) {
            clonedElement.style.height = `${actualHeight}px`;
            clonedElement.style.overflow = 'hidden';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.padding = '0';
            clonedElement.style.margin = '0';
            
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

  // הוספת פונקציות עזר
  const hasAudioFiles = (files) => {
    return files.some(file => file.type?.startsWith('audio/'));
  };

  const hasVideoFiles = (files) => {
    return files.some(file => file.type?.startsWith('video/'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleDefaultPathChange = (newPath) => {
    localStorage.setItem('defaultPath', newPath);
    setDefaultPath(newPath);
  };

  // פונקציה שבודקת אם הטוקן קרוב לפקיעה
  const isTokenExpiringSoon = () => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // convert to milliseconds
      const timeUntilExpiry = expiryTime - Date.now();
      
      // מחזיר true אם נשארו פחות מ-24 שעות
      return timeUntilExpiry < 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  // פונקציה שמחדשת את הטוקן
  const refreshToken = async () => {
    try {
      const response = await fetch(`${API_URL}/api/refresh-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('שגיאה בחידוש טוקן:', data.error);
        if (response.status === 401) {
          handleLogout();
        }
        return;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
    } catch (err) {
      console.error('שגיאת רשת בחידוש טוקן:', err);
      // לא נתנתק במקרה של שגיאת רשת, ננסה שוב בפעם הבאה
    }
  };

  // בדיקה תקופתית של תוקף הטוקן
  useEffect(() => {
    if (!user) return;

    const checkToken = async () => {
      if (isTokenExpiringSoon()) {
        await refreshToken();
      }
    };

    // בדיקה כל שעה
    const interval = setInterval(checkToken, 60 * 60 * 1000);
    
    // בדיקה ראשונית
    checkToken();

    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="app">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <>
          <div className="sidebar">
            <div className="path-section">
              <div className="path-controls">
                <button onClick={handleLogout} className="logout-button">
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
              <FileExplorer currentPath={currentPath} onPathChange={setCurrentPath} />
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