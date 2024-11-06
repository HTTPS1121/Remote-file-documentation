import React from 'react';

function FilterPanel({ selectedTypes, onTypesChange }) {
  const FILE_TYPES = [
    { id: 'mp3', label: 'MP3', category: 'audio' },
    { id: 'mp4', label: 'MP4', category: 'video' }
  ];

  return (
    <div className="filter-panel">
      <h3>סינון לפי סוג קובץ</h3>
      <div className="file-types-grid">
        {FILE_TYPES.map(type => (
          <label key={type.id} className="file-type-checkbox">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type.id)}
              onChange={() => {
                const newTypes = selectedTypes.includes(type.id)
                  ? selectedTypes.filter(t => t !== type.id)
                  : [...selectedTypes, type.id];
                onTypesChange(newTypes);
              }}
            />
            <span>{type.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default FilterPanel; 