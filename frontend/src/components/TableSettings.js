import React, { useState, useEffect } from 'react';

function TableSettings({ onWidthChange, columnWidths, tableSettings, onSettingsChange, exportFormat, onExportFormatChange }) {
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
          
          {/* הגדרות ייצוא */}
          <div className="settings-section">
            <h4>פורמט ייצוא</h4>
            <div className="export-format-settings">
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="jpg"
                  checked={exportFormat === 'jpg'}
                  onChange={(e) => onExportFormatChange(e.target.value)}
                />
                JPG
              </label>
              <label>
                <input
                  type="radio"
                  name="exportFormat"
                  value="png"
                  checked={exportFormat === 'png'}
                  onChange={(e) => onExportFormatChange(e.target.value)}
                />
                PNG
              </label>
            </div>
          </div>

          {/* הגדרות רוחב עמודות */}
          <div className="settings-section">
            <h4>רוחב עמודות</h4>
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

          {/* הגדרות תצוגה */}
          <div className="settings-section">
            <h4>תצוגה</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={tableSettings.showExtensions}
                onChange={(e) => onSettingsChange('showExtensions', e.target.checked)}
              />
              הצג סיומות קבצים
            </label>
          </div>

          {/* הגדרות קווים */}
          <div className="settings-section">
            <h4>מסגרת וקווים</h4>
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
        </div>
      )}
    </div>
  );
}

export default TableSettings; 