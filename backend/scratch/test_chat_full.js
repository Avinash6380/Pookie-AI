import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

const url = 'https://mmkbotlxdbhvnizcefyh.supabase.co';
const anonKey = 'sb_publishable_ikhmtjIsuAGLmXlUWa6kWw__yUsy969';

const testFullChatFlow = async () => {
  const supabaseClient = createClient(url, anonKey);
  
  const testId = Date.now();
  const email = `test_pookie_${testId}@example.com`;
  const password = 'password123';
  const username = `tester_${testId}`;
  
  console.log(`--- Running Self-Contained Integration Test ---`);
  console.log(`1. Registering new user: ${email}...`);
  
  try {
    const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    
    if (!registerResponse.ok) {
      const regErr = await registerResponse.json();
      console.error('Registration failed:', regErr);
      return;
    }
    
    console.log('✅ Registration successful.');
    console.log('2. Logging in to obtain JWT access token...');
    
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError || !authData.session) {
      console.error('Failed to log in:', authError?.message || 'No session returned');
      return;
    }
    
    const token = authData.session.access_token;
    console.log('✅ Login successful! Token acquired.');
    
    console.log('3. Submitting Onboarding Name and Gender...');
    const onboardingResponse = await fetch('http://localhost:5000/api/profile/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Arun Kumar',
        gender: 'male'
      })
    });
    
    if (!onboardingResponse.ok) {
      const onboardErr = await onboardingResponse.json();
      console.error('Onboarding submission failed:', onboardErr);
      return;
    }
    console.log('✅ Onboarding successfully saved.');
    
    console.log('4. Sending factual query for live web search grounding...');
    const queryMessage = '2026 TN CM yaaru?';
    console.log(`Query: "${queryMessage}"`);
    
    const chatResponse = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: queryMessage,
        characterId: 'pookie'
      })
    });
    
    const responseData = await chatResponse.json();
    console.log('Response Status:', chatResponse.status);
    
    if (!chatResponse.ok) {
      console.error('Chat routing returned error:', responseData);
      return;
    }
    
    console.log('\n--- SUCCESS! Response from Companion ---');
    console.log('AI Message Content:', responseData.aiMessage.content);
    console.log('Relationship Level:', responseData.relationship.level);
    console.log('Relationship Level Name:', responseData.relationship.levelName);
    console.log('Relationship XP:', responseData.relationship.xp);
    
  } catch (err) {
    console.error('Integration test error:', err);
  }
};

testFullChatFlow();
