import React, { useState, useEffect } from 'react';

function DocumentationView({ files, currentPath, onPathChange, onError, tableSettings }) {
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setSelectedFile(null);
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    const tableContainer = document.querySelector('.table-container');
    
    const handleScroll = () => {
      if (tableContainer.scrollTop > 0) {
        tableContainer.classList.add('scrolled');
      } else {
        tableContainer.classList.remove('scrolled');
      }
    };

    tableContainer?.addEventListener('scroll', handleScroll);
    return () => tableContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type) => {
    if (!type) return '📄';
    
    if (type.startsWith('audio/')) return '🎵';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('zip') || type.includes('rar')) return '📦';
    if (type.includes('text')) return '📄';
    return '📎';
  };

  const handleFileClick = (file) => {
    if (file.isDirectory) {
      onPathChange(`${currentPath}\\${file.name}`);
    } else {
      setSelectedFile(file);
    }
  };

  const sortFiles = (a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;

    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'duration':
        comparison = (a.duration || 0) - (b.duration || 0);
        break;
      case 'type':
        comparison = (a.type || '').localeCompare(b.type || '');
        break;
      default:
        comparison = 0;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedFiles = [...files].sort(sortFiles);

  // פונקציה להוצאת שם התיקייה מהנתיב
  const getFolderName = () => {
    return currentPath.split('\\').pop();
  };

  const formatFileName = (file) => {
    if (file.isDirectory) return file.name;
    
    if (!tableSettings.showExtensions) {
      const lastDotIndex = file.name.lastIndexOf('.');
      return lastDotIndex > 0 ? file.name.substring(0, lastDotIndex) : file.name;
    }
    
    return file.name;
  };

  return (
    <div className="content-section">
      <div className="header-group">
        <div className="folder-info">
          <div className="folder-name">{getFolderName()}</div>
          <div className="files-count">מספר קבצים: {sortedFiles.length}</div>
        </div>
        <div className="table-headers">
          <div className="header-cell" onClick={() => handleSort('name')}>
            שם {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="header-cell" onClick={() => handleSort('size')}>
            גודל {sortField === 'size' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
          <div className="header-cell" onClick={() => handleSort('duration')}>
            אורך {sortField === 'duration' && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        </div>
      </div>
      <div className="table-container">
        <table className="content-table">
          <tbody>
            {sortedFiles.map(file => (
              <tr 
                key={file.name}
                className={`file-row ${selectedFile?.name === file.name ? 'selected' : ''} ${file.isDirectory ? 'directory' : ''}`}
                onClick={() => handleFileClick(file)}
              >
                <td>
                  <span className="file-icon">{file.isDirectory ? '📁' : getFileIcon(file.type)}</span>
                  <span className="file-name">{formatFileName(file)}</span>
                </td>
                <td>{file.isDirectory ? '-' : formatSize(file.size)}</td>
                <td>{formatDuration(file.duration)}</td>
              </tr>
            ))}
            {sortedFiles.length === 0 && (
              <tr>
                <td colSpan="3" className="empty-state">
                  אין קבצים להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DocumentationView; 