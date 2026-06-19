import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || 'https://mmkbotlxdbhvnizcefyh.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// We'll also test the anon key from frontend/.env
import fs from 'fs';
import path from 'path';

let anonKey = '';
try {
  const frontendEnvPath = path.join(process.cwd(), '..', 'frontend', '.env');
  const content = fs.readFileSync(frontendEnvPath, 'utf8');
  const match = content.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
  if (match) anonKey = match[1].trim();
} catch (e) {
  console.log('Could not read frontend .env file:', e.message);
}

console.log('Supabase URL:', url);
console.log('Service Key (first 10 chars):', serviceKey?.substring(0, 15));
console.log('Anon Key (first 10 chars):', anonKey?.substring(0, 15));

const testServiceRole = async () => {
  if (!serviceKey) return console.log('No service key configured.');
  try {
    const supabase = createClient(url, serviceKey);
    const { data, error } = await supabase.from('characters').select('id, name');
    if (error) {
      console.error('Service role connection error:', error);
    } else {
      console.log('Service role success! Characters:', data);
    }
  } catch (err) {
    console.error('Service role test exception:', err);
  }
};

const testAnonKey = async () => {
  if (!anonKey) return console.log('No anon key configured.');
  try {
    const supabase = createClient(url, anonKey);
    const { data, error } = await supabase.from('characters').select('id, name');
    if (error) {
      console.error('Anon key connection error:', error);
    } else {
      console.log('Anon key success! Characters:', data);
    }
  } catch (err) {
    console.error('Anon key test exception:', err);
  }
};

const run = async () => {
  console.log('--- Testing Service Role Key ---');
  await testServiceRole();
  console.log('\n--- Testing Anon Key ---');
  await testAnonKey();
};

run();
