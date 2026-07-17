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

    // Also copy to Android native directories if present
    const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
    if (fs.existsSync(resDir)) {
      const mipmapFolders = [
        'mipmap-mdpi',
        'mipmap-hdpi',
        'mipmap-xhdpi',
        'mipmap-xxhdpi',
        'mipmap-xxxhdpi'
      ];
      
      mipmapFolders.forEach(folder => {
        const targetFolder = path.join(resDir, folder);
        if (fs.existsSync(targetFolder)) {
          try {
            fs.copyFileSync(srcIcon, path.join(targetFolder, 'ic_launcher.png'));
            fs.copyFileSync(srcIcon, path.join(targetFolder, 'ic_launcher_round.png'));
            fs.copyFileSync(srcIcon, path.join(targetFolder, 'ic_launcher_foreground.png'));
            console.log(`[Setup Android Assets] Successfully updated icons in ${folder}`);
          } catch (androidErr) {
            console.error(`[Setup Android Assets] Error copying to ${folder}:`, androidErr);
          }
        }
      });
    }
  } else {
    console.warn('[Setup PWA Assets] Warning: Source icon station_icon not found.');
  }
} catch (err) {
  console.error('[Setup PWA Assets] Error copying icons:', err);
}
