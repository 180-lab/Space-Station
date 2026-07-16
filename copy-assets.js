import fs from 'fs';
import path from 'path';

let srcIcon = path.join(process.cwd(), 'src', 'assets', 'images', 'space_station_commander_icon_under_256kb-1.png');
if (!fs.existsSync(srcIcon)) {
  srcIcon = path.join(process.cwd(), 'src', 'assets', 'images', 'space_station_commander_icon_under_256kb.png');
}
if (!fs.existsSync(srcIcon)) {
  srcIcon = path.join(process.cwd(), 'src', 'assets', 'images', 'station_icon_1780937637889.png');
}
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  if (fs.existsSync(srcIcon)) {
    fs.copyFileSync(srcIcon, path.join(publicDir, 'icon-192.png'));
    fs.copyFileSync(srcIcon, path.join(publicDir, 'icon-512.png'));
    fs.copyFileSync(srcIcon, path.join(publicDir, 'favicon.png'));
    console.log('[Setup PWA Assets] Successfully copied high-res icons to public/ directory.');
  } else {
    console.warn('[Setup PWA Assets] Warning: Source icon station_icon not found.');
  }
} catch (err) {
  console.error('[Setup PWA Assets] Error copying icons:', err);
}
