import { supabase } from '../services/supabaseClient.js';
import crypto from 'crypto';

async function testInsert() {
  console.log("=== Testing Direct INSERT into public.users ===");
  const testId = crypto.randomUUID();
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: testId,
      username: "admin",
      email: "www.abi.in@gmail.com",
      avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=test"
    })
    .select();

  if (error) {
    console.error("❌ Direct INSERT failed with error:");
    console.error(error);
  } else {
    console.log("✅ Direct INSERT succeeded!", data);
    
    // Clean up
    const { error: delErr } = await supabase
      .from('users')
      .delete()
      .eq('id', testId);
      
    if (delErr) console.error("Clean up error:", delErr.message);
    else console.log("✅ Cleaned up direct insert test row successfully.");
  }
}

testInsert();
