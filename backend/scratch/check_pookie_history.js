import { supabase } from '../services/supabaseClient.js';

const run = async () => {
  const userId = '700d6790-d259-4b08-9d4b-2924ae94f6e4';
  const characterId = 'pookie';
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .eq('character_id', characterId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    console.log('Total messages for pookie:', messages.length);
    messages.forEach((msg, idx) => {
      console.log(`[${idx}] Role: ${msg.role} | Content: "${msg.content}"`);
    });
  } catch (err) {
    console.error('Exception check:', err);
  }
};

run();
