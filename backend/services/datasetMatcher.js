import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

class TFIDFMatcher {
  constructor(documents = []) {
    this.documents = documents;
    this.vocab = new Set();
    this.docTermFreqs = [];
    this.idf = {};
    this.docVectors = [];
    this.buildIndex();
  }

  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s\u0b80-\u0bff]/g, '') // remove punctuation but preserve Tamil Unicode chars
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  buildIndex() {
    this.vocab.clear();
    this.docTermFreqs = [];
    this.idf = {};
    this.docVectors = [];

    const numDocs = this.documents.length;
    if (numDocs === 0) return;

    const docCounts = {};
    
    for (const doc of this.documents) {
      const tokens = this.tokenize(doc.user_query);
      const freqs = {};
      const uniqueTokens = new Set(tokens);
      
      for (const token of tokens) {
        freqs[token] = (freqs[token] || 0) + 1;
        this.vocab.add(token);
      }
      
      this.docTermFreqs.push(freqs);
      
      for (const token of uniqueTokens) {
        docCounts[token] = (docCounts[token] || 0) + 1;
      }
    }

    for (const term of this.vocab) {
      const docsWithTerm = docCounts[term] || 0;
      this.idf[term] = Math.log(1 + (numDocs / (1 + docsWithTerm)));
    }

    for (let i = 0; i < numDocs; i++) {
      const freqs = this.docTermFreqs[i];
      const vector = {};
      let length = 0;
      
      for (const term in freqs) {
        const tf = freqs[term];
        const tfidf = tf * (this.idf[term] || 0);
        vector[term] = tfidf;
        length += tfidf * tfidf;
      }
      
      this.docVectors.push({
        vector,
        length: Math.sqrt(length),
        doc: this.documents[i]
      });
    }
  }

  findBestMatch(queryText) {
    const tokens = this.tokenize(queryText);
    if (tokens.length === 0 || this.docVectors.length === 0) {
      return { match: null, score: 0 };
    }

    const queryFreqs = {};
    for (const token of tokens) {
      queryFreqs[token] = (queryFreqs[token] || 0) + 1;
    }

    const queryVector = {};
    let queryLength = 0;
    for (const term in queryFreqs) {
      if (this.vocab.has(term)) {
        const tf = queryFreqs[term];
        const tfidf = tf * (this.idf[term] || 0);
        queryVector[term] = tfidf;
        queryLength += tfidf * tfidf;
      }
    }
    queryLength = Math.sqrt(queryLength);

    if (queryLength === 0) {
      return { match: null, score: 0 };
    }

    let bestDoc = null;
    let maxSimilarity = 0;

    for (const docVec of this.docVectors) {
      let dotProduct = 0;
      const vec = docVec.vector;
      
      for (const term in queryVector) {
        if (vec[term]) {
          dotProduct += queryVector[term] * vec[term];
        }
      }

      const similarity = dotProduct / (queryLength * docVec.length || 1);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestDoc = docVec.doc;
      }
    }

    return {
      match: bestDoc,
      score: maxSimilarity
    };
  }

  getTopMatches(queryText, limit = 3) {
    const tokens = this.tokenize(queryText);
    if (tokens.length === 0 || this.docVectors.length === 0) {
      return [];
    }

    const queryFreqs = {};
    for (const token of tokens) {
      queryFreqs[token] = (queryFreqs[token] || 0) + 1;
    }

    const queryVector = {};
    let queryLength = 0;
    for (const term in queryFreqs) {
      if (this.vocab.has(term)) {
        const tf = queryFreqs[term];
        const tfidf = tf * (this.idf[term] || 0);
        queryVector[term] = tfidf;
        queryLength += tfidf * tfidf;
      }
    }
    queryLength = Math.sqrt(queryLength);

    if (queryLength === 0) {
      return this.documents.slice(0, limit);
    }

    const results = [];
    for (const docVec of this.docVectors) {
      let dotProduct = 0;
      const vec = docVec.vector;
      
      for (const term in queryVector) {
        if (vec[term]) {
          dotProduct += queryVector[term] * vec[term];
        }
      }

      const similarity = dotProduct / (queryLength * docVec.length || 1);
      results.push({
        doc: docVec.doc,
        score: similarity
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map(r => r.doc);
  }
}

// Local file-based matchers
let maleMatcher = null;
let femaleMatcher = null;

export const loadDatasets = async () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const datasetDir = path.join(__dirname, '../../dataset');

    let malePath = path.join(datasetDir, 'male_tanglish.json');
    if (!fs.existsSync(malePath)) {
      malePath = path.join(datasetDir, 'male_tanglish.jsonn');
    }

    let femalePath = path.join(datasetDir, 'female_tanglish.json');
    if (!fs.existsSync(femalePath)) {
      femalePath = path.join(datasetDir, 'female_tanglish.jsonn');
    }

    let maleDocs = [];
    let femaleDocs = [];

    if (fs.existsSync(malePath)) {
      try {
        const maleData = JSON.parse(fs.readFileSync(malePath, 'utf8'));
        maleDocs = maleData.map(item => ({
          user_query: item.input,
          assistant_response: item.output
        }));
        console.log(`Loaded ${maleDocs.length} records from local male dataset file: ${malePath}`);
      } catch (e) {
        console.error('Error parsing local male dataset file:', e);
      }
    } else {
      console.warn(`Local male dataset file not found at: ${malePath}`);
    }

    if (fs.existsSync(femalePath)) {
      try {
        const femaleData = JSON.parse(fs.readFileSync(femalePath, 'utf8'));
        femaleDocs = femaleData.map(item => ({
          user_query: item.input,
          assistant_response: item.output
        }));
        console.log(`Loaded ${femaleDocs.length} records from local female dataset file: ${femalePath}`);
      } catch (e) {
        console.error('Error parsing local female dataset file:', e);
      }
    } else {
      console.warn(`Local female dataset file not found at: ${femalePath}`);
    }

    maleMatcher = new TFIDFMatcher(maleDocs);
    femaleMatcher = new TFIDFMatcher(femaleDocs);

    console.log(`Trained active matchers: ${maleDocs.length} male docs, ${femaleDocs.length} female docs.`);
    return true;
  } catch (err) {
    console.error('Failed to load and train datasets:', err);
    return false;
  }
};

export const matchMessage = (characterId, message, gender) => {
  let genderMatcher = femaleMatcher;
  if (gender) {
    const cleanGender = gender.toLowerCase().trim();
    if (cleanGender === 'male') {
      genderMatcher = maleMatcher;
    } else if (cleanGender === 'female' || cleanGender === 'trans') {
      genderMatcher = femaleMatcher;
    }
  }

  if (genderMatcher) {
    return genderMatcher.findBestMatch(message);
  }

  return { match: null, score: 0 };
};

export const getClosestMatches = (characterId, message, limit = 3, gender) => {
  let genderMatcher = femaleMatcher;
  if (gender) {
    const cleanGender = gender.toLowerCase().trim();
    if (cleanGender === 'male') {
      genderMatcher = maleMatcher;
    } else if (cleanGender === 'female' || cleanGender === 'trans') {
      genderMatcher = femaleMatcher;
    }
  }

  if (genderMatcher) {
    return genderMatcher.getTopMatches(message, limit);
  }

  return [];
};

// Auto-load on server startup
loadDatasets();
