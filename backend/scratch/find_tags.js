import fs from 'fs';
async function test() {
  const url = `https://html.duckduckgo.com/html/?q=2026+Chief+Minister+of+Tamil+Nadu`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    
    // Find all class names in the html
    const classNames = new Set();
    const classReg = /class="([^"]+)"/g;
    let match;
    while ((match = classReg.exec(html)) !== null) {
      match[1].split(/\s+/).forEach(c => classNames.add(c));
    }
    console.log('Class names found in DDG HTML page:', Array.from(classNames));
    
    // Let's write the html to a file to inspect it
    fs.writeFileSync('backend/scratch/ddg_page.html', html);
    console.log('Saved HTML to backend/scratch/ddg_page.html');
  } catch (err) {
    console.error(err);
  }
}
test();
