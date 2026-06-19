import fs from 'fs';
import path from 'path';

const searchDir = (dir, pattern) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(fullPath, pattern);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(pattern.toLowerCase())) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
};

console.log('Searching for "manual"...');
searchDir(path.resolve('.'), 'manual');
