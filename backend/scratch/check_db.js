import { supabase } from '../services/supabaseClient.js';

async function diagnose() {
  console.log("=== DB Diagnosis ===");
  
  // 1. Check characters
  const { data: chars, error: charsErr } = await supabase.from('characters').select('*');
  if (charsErr) {
    console.error("❌ Error fetching characters:", charsErr.message);
  } else {
    console.log(`✅ Characters found: ${chars.length}`);
  }

  // 2. Check users
  const { data: users, error: usersErr } = await supabase.from('users').select('*').limit(5);
  if (usersErr) {
    console.error("❌ Error fetching users:", usersErr.message);
  } else {
    console.log(`✅ Users table accessible. Count: ${users?.length || 0}`);
  }

  // 3. Check preferences
  const { data: prefs, error: prefsErr } = await supabase.from('preferences').select('*').limit(5);
  if (prefsErr) {
    console.error("❌ Error fetching preferences:", prefsErr.message);
  } else {
    console.log("✅ Preferences table accessible.");
  }

  // 4. Check streaks
  const { data: streaks, error: streaksErr } = await supabase.from('streaks').select('*').limit(5);
  if (streaksErr) {
    console.error("❌ Error fetching streaks:", streaksErr.message);
  } else {
    console.log("✅ Streaks table accessible.");
  }

  // 5. Check relationships
  const { data: rels, error: relsErr } = await supabase.from('relationships').select('*').limit(5);
  if (relsErr) {
    console.error("❌ Error fetching relationships:", relsErr.message);
  } else {
    console.log("✅ Relationships table accessible.");
  }

  // 6. Check relationship_progress
  const { data: progress, error: progressErr } = await supabase.from('relationship_progress').select('*').limit(5);
  if (progressErr) {
    console.error("❌ Error fetching relationship_progress:", progressErr.message);
  } else {
    console.log("✅ Relationship_progress table accessible.");
  }

  // 7. Check user_memory
  const { data: memory, error: memoryErr } = await supabase.from('user_memory').select('*').limit(5);
  if (memoryErr) {
    console.error("❌ Error fetching user_memory:", memoryErr.message);
  } else {
    console.log("❌ User_memory table is missing or inaccessible:", memoryErr.message);
  }
}

diagnose();
