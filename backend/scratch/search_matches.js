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
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(pattern)) {
        console.log(`Found in: ${fullPath}`);
        // Find line numbers
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(pattern)) {
            console.log(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
};

console.log('Searching for matchMessage...');
searchDir(path.resolve('.'), 'matchMessage');

console.log('\nSearching for getClosestMatches...');
searchDir(path.resolve('.'), 'getClosestMatches');
