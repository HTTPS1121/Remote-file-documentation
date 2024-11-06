const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');
const mm = require('music-metadata');

const app = express();

// תיקון פונקציית הסינון בשרת
app.post('/list-directory', async (req, res) => {
  const { path: dirPath, fileTypes } = req.body;
  
  try {
    const files = await fs.readdir(dirPath);
    const filesData = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(dirPath, file);
        const stats = await fs.stat(fullPath);
        const isDirectory = stats.isDirectory();
        const extension = path.extname(file).toLowerCase().slice(1);
        
        const fileInfo = {
          name: file,
          isDirectory,
          size: stats.size,
          type: isDirectory ? null : mime.lookup(file) || null,
          extension: extension || null,
          duration: null
        };

        if (!isDirectory && (fileInfo.type?.startsWith('audio/') || fileInfo.type?.startsWith('video/'))) {
          try {
            const metadata = await mm.parseFile(fullPath);
            fileInfo.duration = metadata.format.duration;
          } catch (err) {
            console.error(`Error getting duration for ${file}:`, err);
          }
        }

        return fileInfo;
      })
    );

    // סינון משופר לפי סיומות
    const filteredFiles = fileTypes.length > 0
      ? filesData.filter(file => 
          file.isDirectory || 
          (file.extension && fileTypes.includes(file.extension))
        )
      : filesData;

    res.json({ files: filteredFiles });
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
}); 