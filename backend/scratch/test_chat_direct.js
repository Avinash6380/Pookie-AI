import { supabase } from '../services/supabaseClient.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const decodeHTMLEntities = (text) => {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
};

const searchDDG = async (query) => {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      console.warn(`DDG search returned HTTP status: ${response.status}`);
      return [];
    }
    const html = await response.text();
    
    const titleReg = /<h2 class="result__title">[\s\S]*?<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetReg = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    
    const titles = [];
    let match;
    while ((match = titleReg.exec(html)) !== null) {
      let link = match[1];
      if (link.includes('uddg=')) {
        const parts = link.split('uddg=');
        if (parts[1]) {
          link = decodeURIComponent(parts[1].split('&')[0]);
        }
      }
      titles.push({
        url: link,
        title: decodeHTMLEntities(match[2].replace(/<[^>]*>/g, '').trim())
      });
    }

    const snippets = [];
    let smatch;
    while ((smatch = snippetReg.exec(html)) !== null) {
      snippets.push(decodeHTMLEntities(smatch[1].replace(/<[^>]*>/g, '').trim()));
    }

    const results = [];
    for (let i = 0; i < Math.min(titles.length, snippets.length); i++) {
      results.push({
        title: titles[i].title,
        url: titles[i].url,
        snippet: snippets[i]
      });
    }
    return results;
  } catch (error) {
    console.error('DDG search helper exception:', error);
    return [];
  }
};

const shouldSearchWeb = (message) => {
  const msg = message.toLowerCase().trim();
  const questionWords = [
    'who', 'what', 'where', 'when', 'why', 'how', 'which', 'whom', 'whose',
    'yaru', 'yaaru', 'enna', 'epdi', 'eppadi', 'enga', 'engu', 'eppo', 'eppodhu', 'edhu', 'edhuku', 'edharkaga', 'yenda', 'yendi',
    'latest', 'news', 'current', 'weather', 'score', 'match', 'result', 'winner', 'update', 'status',
    'cm', 'pm', 'chief minister', 'prime minister', 'president', 'government', 'election', 'elections',
    '2025', '2026', '2024', 'today', 'yesterday', 'tomorrow'
  ];
  return questionWords.some(word => msg.includes(word));
};

const getLevelInfo = (count) => {
  if (count >= 2000) return { level: 'L5', levelName: 'Soulmate', target: 2000000000 };
  if (count >= 1200) return { level: 'L4', levelName: 'Partner', target: 2000 };
  if (count >= 800) return { level: 'L3', levelName: 'Best Friend', target: 1200 };
  if (count >= 500) return { level: 'L2', levelName: 'Close Friend', target: 800 };
  if (count >= 200) return { level: 'L1', levelName: 'Friend', target: 500 };
  return { level: 'L0', levelName: 'Stranger', target: 200 };
};

const runDirectTest = async () => {
  const userId = '700d6790-d259-4b08-9d4b-2924ae94f6e4'; // Avinash
  const characterId = 'pookie';
  const message = '2026 TN CM yaaru?'; // Factual current event question
  
  console.log('--- Running Direct Chat Handler Test with DDG Search Grounding & gemini-flash-lite-latest ---');
  
  try {
    // A. FETCH CHARACTER DETAILS
    const { data: character, error: charErr } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (charErr || !character) {
      console.error('Character not found:', charErr);
      return;
    }

    // B. FETCH USER PREFERENCES
    const { data: preferences } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    let companionName = character.name;
    let companionPersonality = character.personality;

    if (characterId === 'pookie' && preferences) {
      if (preferences.assistant_name) companionName = preferences.assistant_name;
      if (preferences.personality) companionPersonality = preferences.personality;
    }

    // C. FETCH USER ONBOARDING NAME AND GENDER FROM USER_MEMORY
    let userName = 'Guest';
    let gender = 'Unknown';
    const { data: memData } = await supabase
      .from('user_memory')
      .select('memory_key, memory_value')
      .eq('user_id', userId);
    
    if (memData) {
      const nameMem = memData.find(m => m.memory_key === 'user_name');
      const genderMem = memData.find(m => m.memory_key === 'gender');
      if (nameMem?.memory_value) userName = nameMem.memory_value;
      if (genderMem?.memory_value) gender = genderMem.memory_value;
    }

    console.log(`User Name: ${userName}, Gender: ${gender}`);

    // D. FETCH OR INITIALIZE RELATIONSHIP STATUS
    let progress = null;
    const { data, error } = await supabase
      .from('relationship_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      progress = data;
    } else {
      progress = { total_messages: 0, current_level: 'L0', next_level_target: 200 };
    }

    const newCount = progress.total_messages + 1;
    const newLevelInfo = getLevelInfo(newCount);

    console.log(`Relationship Level: ${newLevelInfo.level} (${newLevelInfo.levelName}), Total messages: ${newCount}`);

    // E. FETCH MEMORIES
    const { data: memories } = await supabase
      .from('memory')
      .select('fact')
      .eq('user_id', userId);

    const memoriesList = memories && memories.length > 0
      ? memories.map(m => `- ${m.fact}`).join('\n')
      : 'None yet.';

    // F. PERFORM DDG SEARCH
    let searchContext = 'None available.';
    if (shouldSearchWeb(message)) {
      console.log(`Factual query detected. Fetching live search grounding...`);
      const searchResults = await searchDDG(message);
      if (searchResults && searchResults.length > 0) {
        searchContext = searchResults.map((r, idx) => 
          `[Result ${idx + 1}] Title: "${r.title}"\nSnippet: "${r.snippet}"\nLink: "${r.url}"`
        ).join('\n\n');
        console.log('Successfully fetched search grounding context.');
      } else {
        console.log('Search returned 0 results.');
      }
    }

    // G. CALL GEMINI API WITH GROUNDING CONTEXT
    const systemPrompt = `You are ${companionName}, the user's AI companion.
Your personality style is: ${companionPersonality}.
Your core prompt instruction: ${character.prompt}

User Name: ${userName}
Gender: ${gender}
Relationship Level: ${newLevelInfo.level} (${newLevelInfo.levelName})
Total User Messages sent: ${newCount}

LEVEL-BASED BEHAVIORS:
- L0 (Stranger): You are polite, respectful, curious, slightly reserved, getting to know them. No romantic or overly intimate expressions.

RULES FOR USING THE USER'S NAME:
1. Do NOT repeat the user's name ("${userName}") in every message.
2. Use the name primarily during greetings, emotional support, or special moments.
3. If mentioning the name is unnecessary, chat normally.

TANGLISH TEXTING STYLE (CRITICAL):
1. Write primarily in Tanglish (70% Tanglish transliterated Tamil, 30% English).
2. Mix Tamil texting phrases (like "epdi iruka", "nalla", "enna panra", "rest konjam eduthuko", "naan iruken", "da", "di", "semma") with conversational English.
3. Keep answers relatively short, conversational, and direct (usually 1 to 3 sentences).
4. Use occasional emojis, keep a modern texting style, and NEVER sound like a chatbot.

REAL-TIME WEB SEARCH RESULTS (Use this as grounding context to answer queries accurately. Today's date is June 19, 2026):
${searchContext}

General Rules:
1. Stay in character at all times. NEVER mention you are an AI.
2. Structure your reply in 1 to 3 sentences.`;

    console.log('Calling Gemini API (gemini-flash-lite-latest)...');
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      systemInstruction: systemPrompt
    });

    const chatSession = model.startChat({
      history: []
    });

    // Implement retry logic
    let result;
    let retries = 5;
    let delay = 1000;
    while (retries > 0) {
      try {
        result = await chatSession.sendMessage(message);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.warn(`Retrying in ${delay}ms... due to: ${err.message}`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
      }
    }

    console.log('\n--- SUCCESS! Response from Gemini ---');
    console.log(result.response.text());

  } catch (err) {
    console.error('Test Failed:', err);
  }
};

runDirectTest();
