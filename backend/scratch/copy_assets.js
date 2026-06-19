import fs from 'fs';
import path from 'path';

const publicDir = 'd:/VSCode/Pookie AI/frontend/public';
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log("Created public directory:", publicDir);
}

const sourceDir = 'C:/Users/AVI/.gemini/antigravity/brain/a76d9bc3-af32-4b1b-a432-8f6f84a524c4';

// media__1781858934462.png is the first image uploaded (female pink)
// media__1781858937654.png is the second image uploaded (male blue)
// transgender_icon_1781860014549.png is the generated trans symbol (purple)

const assetsToCopy = [
  { src: 'media__1781858934462.png', dest: 'female.png' },
  { src: 'media__1781858937654.png', dest: 'male.png' },
  { src: 'transgender_icon_1781860014549.png', dest: 'trans.png' }
];

assetsToCopy.forEach(asset => {
  const srcPath = path.join(sourceDir, asset.src);
  const destPath = path.join(publicDir, asset.dest);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${asset.src} -> ${destPath}`);
  } else {
    console.error(`❌ Source file not found: ${srcPath}`);
  }
});
