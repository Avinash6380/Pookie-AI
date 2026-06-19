import { supabase } from '../services/supabaseClient.js';

const run = async () => {
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users in DB:', users);
  }
};

run();
