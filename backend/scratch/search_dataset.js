import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetDir = path.join(__dirname, '../../dataset');

function printFirstEntries(fileName) {
  const filePath = path.join(datasetDir, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`${fileName} not found`);
    return;
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`\n--- First 10 entries in ${fileName} ---`);
  data.slice(0, 10).forEach((m, idx) => {
    console.log(`  [${idx}] Input: "${m.input}" | Output: "${m.output}"`);
  });
}

printFirstEntries('male_tanglish.json');
printFirstEntries('female_tanglish.json');
