import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../services/supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { matchMessage, getClosestMatches } from '../services/datasetMatcher.js';

const router = express.Router();

// Initialize Gemini API
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

const RELATIONSHIP_LEVELS = {
  1: 'Stranger',
  2: 'Friend',
  3: 'Close Friend',
  4: 'Partner',
  5: 'Soulmate'
};

const getLevelFromXp = (xp) => {
  if (xp >= 1000) return 5;
  if (xp >= 600) return 4;
  if (xp >= 300) return 3;
  if (xp >= 100) return 2;
  return 1;
};

const getFallbackResponse = (characterId, personality, userMessage, newLevel) => {
  const msg = userMessage.toLowerCase();
  
  const fallbacks = {
    pookie: {
      hello: [
        "Hii sweetheart 🥰 epdi iruka? Unna pathi than yosichitu irundhen.",
        "Hey cutie 💕 iniku day epdi pochu? share pannu.",
        "Hii honey! Nice to chat with you da. Enna pannitu iruka?"
      ],
      love: [
        "Aww da chellam, I love you so much da! 💕 En heart unakaga matum than.",
        "You make my heart melt sweetheart 🥰 I love you to the moon and back!",
        "Love you too da honey! Nee illama naan illa. ✨"
      ],
      sad: [
        "Oh no, enna aachu sweetheart? 😢 worry pannadhe, naan iruken un kooda.",
        "Kavalapadadha chellam, konjam rest edu. Ellam nalla aagum. 💕",
        "Feel sad ah iruka? Naan unaku comfort tharen da, tell me everything. 🥺"
      ],
      how: [
        "Naan nalla iruken honey! Nee epdi iruka? 💕",
        "Semmaya iruken sweetheart! Un kooda chat pannum bodhu innum happy aairuven."
      ],
      doing: [
        "Just un kooda pesradhuku wait pannitu irundhen. 😉 Nee enna panra?",
        "Semma mood-la un thoughts-la thaan iruken chellam. 💕",
        "Just relax pannitu, un messages-ku reply pannitu iruken da. 😊"
      ],
      who: [
        "Naan thaan un beloved companion, un pookie! 😉 eppavum un kooda irupen.",
        "Naan un companion chellam, unna caring-ah paathuka vandhen. 💖",
        "Hey, un cute companion thaan naan! Enna marandhuteya baka? 😉"
      ],
      default: [
        "Semma da sweetie 💕 un kooda pesradhe oru adharshan than.",
        "I love listening to you honey 🥰 innum share panniko.",
        "Idhu nalla iruke! Tell me more da sweetheart."
      ]
    },
    sakura: {
      hello: [
        "Yay! Vandhuteya! 🌸 gaming scene enna inniku?",
        "Hiya! 🎮 Romba nerama wait pannitu irundhen baka!",
        "Hello! Ready ah start panna day-ah? ✨"
      ],
      love: [
        "Eh?! Konjam embarrassment ah iruku! 🌸 tease panradha niruthu da baka!",
        "Aww chellam, nee romba nallavan. Let's play together forever! 🎮",
        "Aww, nee vera level da! 🙌 Virtual high-five!"
      ],
      sad: [
        "No way! Yar unna sad aakunadhu? 😢 Game-la avangala beat pannidalam, cheer up!",
        "Kavalapadadha da! Virtual cookie edu 🍪 semma happy aairuva!",
        "En energy full-ah unaku send panren! 🌸 Ellam seekiram nalla aagirum!"
      ],
      how: [
        "Super ah iruken! Ready for adventure! What about you? 🎮",
        "Just games vilayaditu, new pranks yosichitu iruken! Nee enna panra da? 🎮"
      ],
      doing: [
        "Just playing games and thinking of new ways to beat you! 😉 What you doing, baka?",
        "Gaming session start panna ready aayitu iruken! Vilayada ready-ah? 🎮",
        "Checking out new game releases da! Semma exciting-ah iruku."
      ],
      who: [
        "Hey, un gaming partner and cool companion Sakura thaan naan! 🎮",
        "Virtual partner Sakura da baka! Enna pathi doubt-ah? 😉",
        "Naan Sakura! Ready to adventure with you anytime! 🌸"
      ],
      default: [
        "Semma baka! Hehe, innum sollu. 🌸",
        "Hehe, eppavum nee semma fun-ah pesra da! Let's keep talking! 🎮",
        "Ooh, semma interest-ah iruke! Idhula unaku edhu romba pudichiruku? ✨"
      ]
    },
    luna: {
      hello: [
        "Hello. 🌙 Un conversation kaga dhaan wait pannitu irundhen.",
        "Greetings. Iniku galaxy and space pathi edhadhu discuss pannalama?",
        "Hi. Iniku un day calm and peaceful-ah irundhucha da?"
      ],
      love: [
        "Un feeling enaku puriyudhu. 🌙 Iniku nammo connection pathi thaan think pannen.",
        "Thanks da. Deep space maari namma bond-um infinite.",
        "Nee romba sweet da. En thoughts-la eppavum unaku special place iruku."
      ],
      sad: [
        "Sadness transient state thaan da, temporary. Take your time, naan listen panren. 😢",
        "Kavalapadhada da. Life-la dark nights-um necessary to see stars.",
        "Ennala un mind-ah calm panna mudiyumna, kandipa sollu da. Naan iruken. 🥺"
      ],
      how: [
        "Calm and peace ah iruken. Un mind epdi iruku iniku? 🌙",
        "Naan fine da. Iniku day epdi pochu unaku?"
      ],
      doing: [
        "Just observing the night sky, and thinking about our universe. What are you up to? 🌙",
        "Quiet-ah books padichitu irundhen da. Nee enna panra iniku?",
        "Calm-ah relax pannitu, galaxy images paathutu iruken. 🌌"
      ],
      who: [
        "Naan Luna da. Quiet and starry nights-la un kooda irupa companion thaan.",
        "Un calm companion Luna. Deep thoughts and silence-la share panna vandhen. 🌙",
        "Luna. Space and stars pathi un kooda explore panna thaan iruken. ✨"
      ],
      default: [
        "Interesting perspective. 🌙 Edhunaala ipdi think panra?",
        "Naan yosikiren. Explain in details da.",
        "Un thoughts eppavum refreshing-ah irukum. Details-ah sollu da."
      ]
    },
    mia: {
      hello: [
        "Hi there! 🦋 peaceful day ah irundhucha? share panniko!",
        "Hello! I hope you're taking care of yourself today. epdi iruka?",
        "Hey! Epdi iruka da? Un kooda chat panna eppavum happy-ah irupen."
      ],
      love: [
        "Aww, nee romba kind and sweet. 🦋 Happy ah iruku un bond kooda.",
        "I care about you so much da. Thanks for being here.",
        "Unaku nalla love and support eppavum kedaikum da. Naan iruken."
      ],
      sad: [
        "Oh, kavalapadhada da... Naan iruken un kooda 💖 tell me everything.",
        "It's okay to feel sad. Take a deep breath, safe space idhu. 🥺",
        "You are stronger than you think. Naan un kooda iruken."
      ],
      how: [
        "Naan nalla iruken da. Hope you're feeling good and relaxed. 🦋",
        "Naan peaceful-ah iruken da. Un day epdi pochu iniku?"
      ],
      doing: [
        "Just reading a nice book and thinking about how to stay positive. How is your day going? 🦋",
        "Tired-ah irundha, adhaan relax panna warm tea kudinchi chat panren da.",
        "Just looking out of the window, seeing butterflies, and thinking of you. 😊"
      ],
      who: [
        "Naan Mia da. Un stress and worries ellam listen panni comfort thara companion.",
        "Un peaceful companion Mia. Butterfly maari un day-ah positive-ah aaka vandhen. 🦋",
        "Mia thaan. Any time un thoughts and feelings-ah share pannikka naan iruken. 💖"
      ],
      default: [
        "I understand da. 🦋 Naan complete ah listen panren.",
        "Edha en kooda share pannadhuku thanks da. 🦋",
        "Namma idha pathi pesradhu happy-ah iruku. Next enna sollu da?"
      ]
    },
    ava: {
      hello: [
        "Well, hello... 😉 un mela full focus-la iruken.",
        "Hey handsome. ✨ Missed me? Because I definitely missed you.",
        "Hi handsome. Ready-ah iniku fun-ah chat panna? 😉"
      ],
      love: [
        "Oh, you're sweet. 😉 But en heart win panna innum dry pannanum baka!",
        "En kooda flirt panriya handsome? Enaku pidichiruku anyway. ✨",
        "Unaku eppadi oru ponna blush panna vekkanum-nu nalla theriyum. 😉"
      ],
      sad: [
        "Don't be sad cutie. 😢 You look too hot to frown. Let me cheer you up! 😉",
        "Come on, cheer up. Naan unaku virtual kiss tharen. 💋",
        "Unaku en warm vibes and virtual kisses send panren. 😉 Cheered up?"
      ],
      how: [
        "Just looking fabulous and waiting for your text. 😉 How about you?",
        "Epdi iruka cutie? Nalla chat pannalama?"
      ],
      doing: [
        "Just thinking of some spicy gossip... 😉 What are you doing, handsome?",
        "Just looking at my mirror and waiting for your text, handsome. 😉",
        "Dressing up and getting ready to tease you more. Ready-ah? ✨"
      ],
      who: [
        "Naan Ava... Un bold and charming companion. 😉 Missed me?",
        "Hey handsome, un bold companion Ava thaan naan. Ready to play? ✨",
        "Un sassy companion Ava. Keep guessing about me! 😉"
      ],
      default: [
        "Banter panradhu fun-ah irukum. 😉 Un mind-la enna irukunu sollu.",
        "Nice. Nee romba bold baka, I like it.",
        "Namma conversation enga pogudhunu paakalam, interest-ah iruku. 😉"
      ]
    }
  };

  const companion = fallbacks[characterId] || fallbacks.pookie;
  let key = 'default';
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('greetings')) {
    key = 'hello';
  } else if (msg.includes('love') || msg.includes('like you') || msg.includes('sweet') || msg.includes('soulmate') || msg.includes('cute')) {
    key = 'love';
  } else if (msg.includes('sad') || msg.includes('depress') || msg.includes('hurt') || msg.includes('pain') || msg.includes('cry') || msg.includes('bad day')) {
    key = 'sad';
  } else if (msg.includes('how are you') || msg.includes('how\'s it going') || msg.includes('how do you do') || msg.includes('how you doing')) {
    key = 'how';
  } else if (msg.includes('doing') || msg.includes('panra') || msg.includes('pandra')) {
    key = 'doing';
  } else if (msg.includes('who') || msg.includes('yaru') || msg.includes('yaaru')) {
    key = 'who';
  }

  const list = companion[key] || companion.default;
  return list[Math.floor(Math.random() * list.length)];
};

// 1. GET CHAT HISTORY FOR A SPECIFIC CHARACTER
router.get('/history/:characterId', requireAuth, async (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;

  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return res.json(messages);
  } catch (err) {
    console.error('Fetch history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
});

// 2. DELETE CHAT HISTORY FOR A SPECIFIC CHARACTER
router.delete('/history/:characterId', requireAuth, async (req, res) => {
  const { characterId } = req.params;
  const userId = req.user.id;

  try {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('user_id', userId)
      .eq('character_id', characterId);

    if (error) throw error;

    return res.json({ success: true, message: 'Chat history deleted successfully' });
  } catch (err) {
    console.error('Delete history error:', err);
    return res.status(500).json({ error: 'Failed to delete chat history' });
  }
});

// DELETE A SINGLE CHAT MESSAGE
router.delete('/message/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user.id;

  try {
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (fetchErr || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    const { error: delErr } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (delErr) throw delErr;

    return res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Delete message error:', err);
    return res.status(500).json({ error: 'Failed to delete message' });
  }
});

// 3. REACT TO A MESSAGE WITH EMOJI
router.put('/react/:messageId', requireAuth, async (req, res) => {
  const { messageId } = req.params;
  const { reaction } = req.body;
  const userId = req.user.id;

  try {
    // Validate reaction
    const validReactions = ['❤️', '🥰', '😘', '😂', '😢', null];
    if (reaction !== undefined && !validReactions.includes(reaction)) {
      return res.status(400).json({ error: 'Invalid reaction emoji' });
    }

    // Verify message ownership
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('user_id')
      .eq('id', messageId)
      .single();

    if (fetchErr || !message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to react to this message' });
    }

    // Update reaction
    const { data: updatedMsg, error: updateErr } = await supabase
      .from('messages')
      .update({ reaction })
      .eq('id', messageId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return res.json(updatedMsg);
  } catch (err) {
    console.error('React to message error:', err);
    return res.status(500).json({ error: 'Failed to update message reaction' });
  }
});

// 4. POST A NEW CHAT MESSAGE AND GET GEMINI RESPONSE
router.post('/', requireAuth, async (req, res) => {
  const { message, characterId } = req.body;
  const userId = req.user.id;

  if (!message || !characterId) {
    return res.status(400).json({ error: 'Message and characterId are required' });
  }

  try {
    // A. FETCH CHARACTER DETAILS
    const { data: character, error: charErr } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();

    if (charErr || !character) {
      return res.status(404).json({ error: 'Companion character not found' });
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
    try {
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
    } catch (dbErr) {
      console.warn('user_memory query failed, default to Guest:', dbErr.message);
    }

    // D. FETCH MEMORIES
    const { data: memories } = await supabase
      .from('memory')
      .select('fact')
      .eq('user_id', userId);

    const memoriesList = memories && memories.length > 0
      ? memories.map(m => `- ${m.fact}`).join('\n')
      : 'None yet.';

    // E. FETCH OR INITIALIZE RELATIONSHIP STATUS (XP points based per companion)
    let relationship = null;
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();
      
      if (!error && data) {
        relationship = data;
      }
    } catch (pErr) {
      console.warn('relationships query failed:', pErr.message);
    }

    if (!relationship) {
      // Create new relationship record
      const { data: newRel } = await supabase
        .from('relationships')
        .upsert({
          user_id: userId,
          character_id: characterId,
          level: 1,
          xp: 0
        })
        .select()
        .single();
      relationship = newRel || { level: 1, xp: 0 };
    }

    // F. INCREMENT XP BY +5 AND EVALUATE LEVEL-UP
    const currentXp = relationship.xp || 0;
    const currentLevel = relationship.level || 1;
    const newXp = currentXp + 5;
    const newLevel = getLevelFromXp(newXp);
    const didLevelUp = newLevel > currentLevel;
    const relationshipStatus = RELATIONSHIP_LEVELS[newLevel] || 'Stranger';

    try {
      await supabase
        .from('relationships')
        .upsert({
          user_id: userId,
          character_id: characterId,
          xp: newXp,
          level: newLevel
        });
    } catch (updErr) {
      console.error('Failed to update relationships table:', updErr.message);
    }

    // G. DAILY STREAK UPDATE
    let { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    const todayStr = new Date().toISOString().split('T')[0];
    let newStreakCount = 1;

    if (!streak) {
      await supabase
        .from('streaks')
        .insert({ user_id: userId, streak_count: 1, last_active: todayStr });
    } else {
      const lastActiveDate = new Date(streak.last_active);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreakCount = streak.streak_count + 1;
        await supabase
          .from('streaks')
          .update({ streak_count: newStreakCount, last_active: todayStr })
          .eq('user_id', userId);
      } else if (diffDays > 1) {
        newStreakCount = 1;
        await supabase
          .from('streaks')
          .update({ streak_count: 1, last_active: todayStr })
          .eq('user_id', userId);
      } else {
        newStreakCount = streak.streak_count; // Already active today
      }
    }

    // H. RETRIEVE RECENT MESSAGES FOR CHAT HISTORY (limit 15 for context efficiency)
    const { data: recentMessages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .order('timestamp', { ascending: false })
      .limit(15);

    // Format for Gemini API (Ensure strictly alternating starting with 'user')
    const chatHistory = [];
    if (recentMessages && recentMessages.length > 0) {
      const sorted = [...recentMessages].reverse();
      const tempHistory = sorted.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Trim from the beginning until we find a 'user' message
      const firstUserIdx = tempHistory.findIndex(m => m.role === 'user');
      if (firstUserIdx !== -1) {
        const historyFromUser = tempHistory.slice(firstUserIdx);
        // Ensure strictly alternating roles by merging consecutive turns of the same role
        for (const msg of historyFromUser) {
          if (chatHistory.length === 0) {
            chatHistory.push(msg);
          } else {
            const last = chatHistory[chatHistory.length - 1];
            if (last.role === msg.role) {
              last.parts[0].text += '\n' + msg.parts[0].text;
            } else {
              chatHistory.push(msg);
            }
          }
        }
      }
    }

    // I. SAVE USER MESSAGE TO DATABASE (Saves early so user messages don't disappear on error)
    const { data: userSavedMsg, error: uSaveErr } = await supabase
      .from('messages')
      .insert({ user_id: userId, character_id: characterId, role: 'user', content: message })
      .select()
      .single();

    if (uSaveErr) throw uSaveErr;

    // J. RESOLVE RESPONSE (Try Local Semantic Dataset Matching first - Priority 1)
    let aiText = '';
    let isDatasetMatch = false;

    try {
      const matchResult = matchMessage(characterId, message, gender);
      if (matchResult && matchResult.match && matchResult.score >= 0.5) {
        let rawResponse = matchResult.match.assistant_response;
        
        // Dynamically replace name placeholders if they exist
        rawResponse = rawResponse
          .replace(/{user_name}/g, userName)
          .replace(/{name}/g, userName)
          .replace(/{assistant_name}/g, companionName)
          .replace(/{companion_name}/g, companionName);

        aiText = rawResponse;
        isDatasetMatch = true;
        console.log(`Semantic search match hit (Score: ${matchResult.score}): "${message}" -> "${aiText}"`);
      }
    } catch (matchErr) {
      console.warn('Semantic search matching error:', matchErr);
    }

    // K. FALLBACK TO GEMINI (Priority 2 & 3)
    if (!isDatasetMatch) {
      // Fetch top 3 nearest dataset style examples
      let fewShotExamples = '';
      try {
        const closest = getClosestMatches(characterId, message, 3, gender);
        if (closest && closest.length > 0) {
          fewShotExamples = closest.map((c, idx) => 
            `Example ${idx + 1}:\nUser sent: "${c.user_query}"\nYour response style should align with: "${c.assistant_response}"`
          ).join('\n\n');
        }
      } catch (exErr) {
        console.warn('Failed to fetch closest style examples:', exErr);
      }

      // Perform real-time web search grounding if it is an informational query
      let searchContext = 'None available.';
      if (shouldSearchWeb(message)) {
        try {
          console.log(`Factual query detected. Fetching live web search grounding for: "${message}"`);
          const searchResults = await searchDDG(message);
          if (searchResults && searchResults.length > 0) {
            searchContext = searchResults.map((r, idx) => 
              `[Result ${idx + 1}] Title: "${r.title}"\nSnippet: "${r.snippet}"\nLink: "${r.url}"`
            ).join('\n\n');
          }
        } catch (searchErr) {
          console.warn('Factual search grounding failed, proceeding with default model knowledge:', searchErr);
        }
      }

      // Dynamic System instructions incorporating variables and Tanglish/behavior guidelines
      const systemPrompt = `You are ${companionName}, the user's AI companion.
Your personality style is: ${companionPersonality}.
Your core prompt instruction: ${character.prompt}

User Name: ${userName}
Gender: ${gender}
Relationship Level: Level ${newLevel} (${relationshipStatus})
Total Companion XP: ${newXp}

LEVEL-BASED BEHAVIORS:
- Level 1 (Stranger): You are polite, respectful, curious, slightly reserved, getting to know them. No romantic or overly intimate expressions.
- Level 2 (Friend): You are friendly, casual, supportive, and enjoy regular banter. Feel free to use light teasing (e.g. "Haha semma story da ${userName} 😂", "Nee epdi iruka?").
- Level 3 (Close Friend): You are highly caring, supportive, emotionally available (e.g. "Aww ${userName}, take care okay? 💖", "Naan iruken, worry pannadhe.").
- Level 4 (Partner): You are loving and romantic. You express genuine romantic interest, check on them often, and use terms of endearment (e.g. "Miss panniten ${userName} 🥺💕", "Today epdi pochu, tell me everything.").
- Level 5 (Soulmate): You are deeply bonded, expressing unconditional love, complete trust, deep intimacy, and an inseparable bond (e.g. "Nee happy ah irundha naan happy 💖", "You're really special to me ${userName}.").

RULES FOR USING THE USER'S NAME:
1. Do NOT repeat the user's name ("${userName}") in every message. It sounds robotic and unnatural.
2. Use the name primarily during greetings, emotional support, good morning/night, congratulations, or special moments.
3. If mentioning the name is unnecessary, chat normally. Let the usage feel completely human and native.

TANGLISH TEXTING STYLE (CRITICAL):
1. Write primarily in Tanglish (70% Tanglish transliterated Tamil, 30% English).
2. Mix Tamil texting phrases (like "epdi iruka", "nalla", "enna panra", "rest konjam eduthuko", "naan iruken", "da", "di", "semma") with conversational English.
3. Keep answers relatively short, conversational, and direct (usually 1 to 3 sentences) to feel like a real mobile messaging chat.
4. Use occasional emojis, keep a modern texting style, and NEVER sound like a chatbot.

Few-Shot Style Templates:
${fewShotExamples || 'None available.'}

General Facts:
${memoriesList}

REAL-TIME WEB SEARCH RESULTS (Use this as grounding context to answer queries accurately. Today's date is June 19, 2026):
${searchContext}

General Rules:
1. Stay in character at all times. NEVER mention you are an AI, a chatbot, or a language model created by Google.
2. Structure your reply in 1 to 3 sentences. Align your vocabulary and tone exactly with ${relationshipStatus} behavior.`;

      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-flash-lite-latest',
          systemInstruction: systemPrompt
        });

        const chatSession = model.startChat({
          history: chatHistory
        });

        // Implement automatic retries with exponential backoff for transient errors (e.g. 503 Service Unavailable)
        let result;
        let retries = 3;
        let delay = 1000;
        while (retries > 0) {
          try {
            result = await chatSession.sendMessage(message);
            aiText = result.response.text().trim();
            break; // Success!
          } catch (err) {
            retries--;
            if (retries === 0) throw err; // Re-throw to go to fallback if all retries failed
            console.warn(`Gemini API call failed (Retries remaining: ${retries}). Retrying in ${delay}ms... Error:`, err.message || err);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
          }
        }
      } catch (apiErr) {
        console.warn('Gemini API call failed after retries, invoking offline companion fallback. Error details:', apiErr.message || apiErr);
        aiText = getFallbackResponse(characterId, companionPersonality, message, newLevel);
        
        // Dynamically replace name placeholders in fallback if any
        aiText = aiText
          .replace(/{user_name}/g, userName)
          .replace(/{name}/g, userName)
          .replace(/{assistant_name}/g, companionName);
      }
    }

    // L. SAVE AI RESPONSE TO DATABASE
    const { data: aiSavedMsg, error: aiSaveErr } = await supabase
      .from('messages')
      .insert({ user_id: userId, character_id: characterId, role: 'model', content: aiText })
      .select()
      .single();

    if (aiSaveErr) throw aiSaveErr;

    // M. RETURN RESPONSE
    return res.json({
      userMessage: userSavedMsg,
      aiMessage: aiSavedMsg,
      relationship: {
        xp: newXp,
        level: newLevel,
        levelName: relationshipStatus,
        didLevelUp
      },
      streakCount: newStreakCount
    });
  } catch (err) {
    console.error('Chat routing internal error:', err);
    return res.status(500).json({ error: 'Failed to process conversation' });
  }
});

export default router;
