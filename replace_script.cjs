const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'vite.config.ts',
  'start-server.bat',
  'clear-orders.bat',
  'index.html',
  'metadata.json',
  'src/types.ts',
  'src/App.tsx',
  'src/components/LandingHub.tsx',
  'src/components/KioskPanel.tsx',
  'src/components/KasirPanel.tsx',
  'src/components/AdminPanel.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace CSM Jakarta 2026
    content = content.replace(/CSM Jakarta 2026/g, 'CSM Bandung 2026');
    content = content.replace(/CSM JAKARTA 2026/g, 'CSM BANDUNG 2026');
    
    // Replace GBK Area
    content = content.replace(/GBK AREA/g, 'KIARA ARTHA PARK');
    content = content.replace(/Hutan GBK Jakarta/g, 'Kiara Artha Park Bandung');
    
    // Replace Dates
    content = content.replace(/11 - 14 Juni 2026/g, '23 - 26 Juli 2026');
    content = content.replace(/11 Juni - 14 Juni 2026/g, '23 Juli - 26 Juli 2026');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
