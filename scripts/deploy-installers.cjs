const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '../release');
const downloadsDir = path.join(__dirname, '../dist/downloads');

// Ensure downloads directory exists inside dist/
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Map electron-builder outputs to clean download names
const filesToCopy = [
  { prefix: 'Pallavan MES Setup', ext: '.exe', dest: 'Pallavan-MES-Windows-Setup.exe' },
  { prefix: 'Pallavan MES-', ext: '.dmg', dest: 'Pallavan-MES-Mac-Setup.dmg' },
  { prefix: 'Pallavan MES-', ext: '.AppImage', dest: 'Pallavan-MES-Linux-Setup.AppImage' }
];

if (fs.existsSync(releaseDir)) {
  const releaseFiles = fs.readdirSync(releaseDir);
  
  releaseFiles.forEach(file => {
    filesToCopy.forEach(mapping => {
      if (file.startsWith(mapping.prefix) && (!mapping.ext || file.endsWith(mapping.ext))) {
        const srcPath = path.join(releaseDir, file);
        const destPath = path.join(downloadsDir, mapping.dest);
        
        console.log(`Copying installer: ${file} -> dist/downloads/${mapping.dest}`);
        fs.copyFileSync(srcPath, destPath);
      }
    });
  });
  console.log('? Installers successfully staged in dist/downloads/ for web hosting.');
} else {
  console.log('?? No release/ directory found. Run npm run electron:build first to generate installers.');
}
