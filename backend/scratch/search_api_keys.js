import fs from 'fs';
import path from 'path';

const searchDir = (dir, pattern) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === '.system_generated') continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern);
    } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.json') || file.endsWith('.css') || file.endsWith('.html') || file.endsWith('.sql'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`Found pattern in ${fullPath}`);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(pattern.toLowerCase())) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
};

console.log('Searching for "API key" in frontend and backend...');
searchDir(path.join(process.cwd(), '..'), 'API key');
