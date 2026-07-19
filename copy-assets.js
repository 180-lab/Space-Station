import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

      // Regenerate Splash Screens if ImageMagick is installed
      let hasConvert = false;
      try {
        execSync('convert -version', { stdio: 'ignore' });
        hasConvert = true;
      } catch (e) {
        // convert not available
      }

      if (hasConvert) {
        console.log('[Setup Android Assets] ImageMagick detected. Regenerating high-quality uncorrupted splash screens...');
        const splashScreens = [
          { folder: 'drawable', width: 512, height: 512, iconSize: 256 },
          { folder: 'drawable-land-mdpi', width: 800, height: 480, iconSize: 200 },
          { folder: 'drawable-land-hdpi', width: 1024, height: 768, iconSize: 320 },
          { folder: 'drawable-land-xhdpi', width: 1280, height: 800, iconSize: 350 },
          { folder: 'drawable-land-xxhdpi', width: 1600, height: 960, iconSize: 400 },
          { folder: 'drawable-land-xxxhdpi', width: 1920, height: 1280, iconSize: 500 },
          { folder: 'drawable-port-mdpi', width: 480, height: 800, iconSize: 240 },
          { folder: 'drawable-port-hdpi', width: 768, height: 1024, iconSize: 350 },
          { folder: 'drawable-port-xhdpi', width: 800, height: 1280, iconSize: 400 },
          { folder: 'drawable-port-xxhdpi', width: 960, height: 1600, iconSize: 480 },
          { folder: 'drawable-port-xxxhdpi', width: 1280, height: 1920, iconSize: 640 }
        ];

        splashScreens.forEach(({ folder, width, height, iconSize }) => {
          const targetFolder = path.join(resDir, folder);
          if (fs.existsSync(targetFolder)) {
            try {
              const targetPath = path.join(targetFolder, 'splash.png');
              const cmd = `convert -size ${width}x${height} xc:"#090c15" \\( "${srcIcon}" -resize ${iconSize}x${iconSize} \\) -gravity center -composite "${targetPath}"`;
              execSync(cmd);
              console.log(`[Setup Android Assets] Regenerated splash.png in ${folder} (${width}x${height})`);
            } catch (splashErr) {
              console.error(`[Setup Android Assets] Failed to regenerate splash.png in ${folder}:`, splashErr.message);
            }
          }
        });
      } else {
        console.log('[Setup Android Assets] ImageMagick not detected on system. Skipping splash screen regeneration (will use existing splash assets).');
      }
    }
  } else {
    console.warn('[Setup PWA Assets] Warning: Source icon station_icon not found.');
  }
} catch (err) {
  console.error('[Setup PWA Assets] Error copying icons:', err);
}
