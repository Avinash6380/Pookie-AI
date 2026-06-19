import fs from 'fs';

function testParsing() {
  const html = fs.readFileSync('backend/scratch/ddg_page.html', 'utf8');
  
  const titleReg = /<h2 class="result__title">[\s\S]*?<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetReg = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  
  const titles = [];
  let match;
  while ((match = titleReg.exec(html)) !== null) {
    // Decode url from DDG format: //duckduckgo.com/l/?uddg=URL&rut=...
    let url = match[1];
    if (url.includes('uddg=')) {
      const parts = url.split('uddg=');
      if (parts[1]) {
        url = decodeURIComponent(parts[1].split('&')[0]);
      }
    }
    titles.push({
      url,
      title: match[2].replace(/<[^>]*>/g, '').trim()
    });
  }

  const snippets = [];
  let smatch;
  while ((smatch = snippetReg.exec(html)) !== null) {
    snippets.push(smatch[1].replace(/<[^>]*>/g, '').trim());
  }

  console.log(`Found ${titles.length} titles and ${snippets.length} snippets.`);
  const results = [];
  for (let i = 0; i < Math.min(titles.length, snippets.length); i++) {
    results.push({
      title: titles[i].title,
      url: titles[i].url,
      snippet: snippets[i]
    });
  }
  return results;
}

const results = testParsing();
console.log('Results:\n', JSON.stringify(results.slice(0, 3), null, 2));
