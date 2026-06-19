import { supabase } from '../services/supabaseClient.js';

async function checkCharacters() {
  console.log("=== Checking Characters in DB ===");
  const { data, error } = await supabase.from('characters').select('id, name');
  if (error) {
    console.error("❌ Error fetching characters:", error.message);
  } else {
    console.log("✅ Characters stored in database:", data);
  }
}

checkCharacters();
