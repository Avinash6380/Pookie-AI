import { supabase } from '../services/supabaseClient.js';

const run = async () => {
  console.log('Testing inserting a row with a gender field into datasets table...');
  const { data, error } = await supabase
    .from('datasets')
    .insert({
      character_id: 'pookie',
      user_query: 'test_temp_query',
      assistant_response: 'test_temp_response',
      gender: 'male'
    })
    .select();

  if (error) {
    console.log('Insert failed:', error.message);
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('Result: The gender column does NOT exist in the datasets table.');
    }
  } else {
    console.log('Insert succeeded! The gender column exists.', data);
    // Clean up
    await supabase.from('datasets').delete().eq('user_query', 'test_temp_query');
  }
};

run();
