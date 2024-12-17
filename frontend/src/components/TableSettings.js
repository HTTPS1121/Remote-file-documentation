import React, { useState, useEffect } from 'react';

function TableSettings({ onWidthChange, columnWidths, tableSettings, onSettingsChange, exportFormat, onExportFormatChange, defaultPath, onDefaultPathChange }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event) => {
      const panel = document.querySelector('.settings-panel');
      const button = document.querySelector('.settings-button');
      if (panel && !panel.contains(event.target) && !button.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="table-settings">
      <button 
        className="settings-button" 
        onClick={() => setIsOpen(!isOpen)}
        title="הגדרות"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="settings-panel">
          <div className="settings-group">
            <h3>פורמט ייצוא</h3>
            <div className="export-format-settings">
              <label className="format-container">
                <input
                  type="radio"
                  name="exportFormat"
                  value="jpg"
                  checked={exportFormat === 'jpg'}
                  onChange={(e) => onExportFormatChange(e.target.value)}
                />
                <svg viewBox="0 0 64 64" height="1.5em" width="1.5em">
                  <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" 
                    pathLength="575.0541381835938" 
                    className="format-path">
                  </path>
                </svg>
                <span className="format-label">JPG</span>
              </label>

              <label className="format-container">
                <input
                  type="radio"
                  name="exportFormat"
                  value="png"
                  checked={exportFormat === 'png'}
                  onChange={(e) => onExportFormatChange(e.target.value)}
                />
                <svg viewBox="0 0 64 64" height="1.5em" width="1.5em">
                  <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" 
                    pathLength="575.0541381835938" 
                    className="format-path">
                  </path>
                </svg>
                <span className="format-label">PNG</span>
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>רוחב עמודות</h3>
            <div className="width-settings">
              <label>
                שם
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={columnWidths.name}
                  onChange={(e) => onWidthChange('name', e.target.value)}
                />
                px
              </label>
              <label>
                גודל
                <input
                  type="number"
                  min="50"
                  max="300"
                  value={columnWidths.size}
                  onChange={(e) => onWidthChange('size', e.target.value)}
                />
                px
              </label>
              <label>
                אורך
                <input
                  type="number"
                  min="50"
                  max="300"
                  value={columnWidths.duration}
                  onChange={(e) => onWidthChange('duration', e.target.value)}
                />
                px
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>תצוגה</h3>
            <div className="display-settings">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={tableSettings.showExtensions}
                  onChange={(e) => onSettingsChange('showExtensions', e.target.checked)}
                />
                הצג סיומות קבצים
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>מסגרת וקווים</h3>
            <div className="border-settings">
              <div className="settings-group">
                <h5>עובי קווים</h5>
                <label>
                  <span>קווים אופקיים</span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={tableSettings.horizontalLineWidth}
                      onChange={(e) => onSettingsChange('horizontalLineWidth', e.target.value)}
                    />
                    <span>px</span>
                  </div>
                </label>
                <label>
                  <span>קווים אנכיים</span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={tableSettings.verticalLineWidth}
                      onChange={(e) => onSettingsChange('verticalLineWidth', e.target.value)}
                    />
                    <span>px</span>
                  </div>
                </label>
              </div>
              
              <div className="settings-group">
                <h5>מסגרת חיצונית</h5>
                <label>
                  <span>עובי מסגרת</span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={tableSettings.borderWidth}
                      onChange={(e) => onSettingsChange('borderWidth', e.target.value)}
                    />
                    <span>px</span>
                  </div>
                </label>
                <label>
                  <span>עיגול פינות</span>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={tableSettings.borderRadius}
                      onChange={(e) => onSettingsChange('borderRadius', e.target.value)}
                    />
                    <span>px</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <h3>נתיב ברירת מחדל</h3>
            <div className="default-path-settings">
              <input
                type="text"
                value={defaultPath}
                onChange={(e) => onDefaultPathChange(e.target.value)}
                placeholder="הכנס נתיב ברירת מחדל"
                dir="ltr"
              />
              <div className="path-hint">
                נתיב זה ישמש בכל פתיחה מחדש של האפליקציה
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableSettings; 