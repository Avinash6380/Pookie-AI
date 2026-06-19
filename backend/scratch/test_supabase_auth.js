import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = 'https://mmkbotlxdbhvnizcefyh.supabase.co';
const anonKey = 'sb_publishable_ikhmtjIsuAGLmXlUWa6kWw__yUsy969';

const testAuth = async () => {
  const supabase = createClient(url, anonKey);
  console.log('Testing Supabase Auth SignUp with Anon Key...');
  
  const testEmail = `test_pookie_${Date.now()}@example.com`;
  const testPassword = 'password123';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: 'testuser'
        }
      }
    });
    
    if (error) {
      console.error('SignUp Error:', error);
    } else {
      console.log('SignUp Success!', data.user ? 'User created: ' + data.user.email : 'No user returned');
    }
  } catch (err) {
    console.error('SignUp Exception:', err);
  }
};

testAuth();
