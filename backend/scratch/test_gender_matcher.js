import { matchMessage, loadDatasets } from '../services/datasetMatcher.js';

const run = async () => {
  console.log('Initializing and loading datasets...');
  const loaded = await loadDatasets();
  if (!loaded) {
    console.error('Failed to load datasets!');
    process.exit(1);
  }

  const queries = [
    { text: 'naan tired ah iruken', gender: 'male' },
    { text: 'naan tired ah iruken', gender: 'female' },
    { text: 'naan tired ah iruken', gender: 'trans' },
    { text: 'good morning', gender: 'male' },
    { text: 'good morning', gender: 'female' },
    { text: 'naan unna miss panren', gender: 'male' },
    { text: 'naan unna miss panren', gender: 'female' }
  ];

  console.log('\n--- TESTING SEMANTIC MATCHING ---');
  for (const q of queries) {
    const result = matchMessage('pookie', q.text, q.gender);
    console.log(`\nQuery: "${q.text}" | Gender: ${q.gender}`);
    if (result && result.match) {
      console.log(`Match Hit (Score: ${result.score.toFixed(4)})`);
      console.log(`-> Query Template: "${result.match.user_query}"`);
      console.log(`-> Response: "${result.match.assistant_response}"`);
    } else {
      console.log(`No confidence match (Score: ${result?.score?.toFixed(4) || 0})`);
    }
  }
};

run();
