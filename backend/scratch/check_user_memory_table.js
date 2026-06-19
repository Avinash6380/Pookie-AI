import { supabase } from '../services/supabaseClient.js';

const run = async () => {
  const userId = '700d6790-d259-4b08-9d4b-2924ae94f6e4';
  try {
    const { data: mem, error: memErr } = await supabase.from('user_memory').select('*').eq('user_id', userId);
    console.log('user_memory entries:', mem);

    const { data: rel, error: relErr } = await supabase.from('relationship_progress').select('*').eq('user_id', userId);
    console.log('relationship_progress entries:', rel);
  } catch (err) {
    console.error('Exception check:', err);
  }
};

run();
