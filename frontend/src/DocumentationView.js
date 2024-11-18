import React, { useState, useEffect } from 'react';

function DocumentationView({ files, currentPath, onPathChange, onError }) {
  // ... existing code ...

  useEffect(() => {
    // הגדרת ערכי ברירת מחדל אם אין ערכים מותאמים אישית
    if (!document.documentElement.style.getPropertyValue('--name-width')) {
      document.documentElement.style.setProperty('--name-width', '300px');
      document.documentElement.style.setProperty('--size-width', '100px');
      document.documentElement.style.setProperty('--duration-width', '100px');
    }
  }, []);

  // ... rest of the code ...
} 