import { supabase } from '../services/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const run = async () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const datasetDir = path.join(__dirname, '../../dataset');

    const malePath = path.join(datasetDir, 'male_tanglish.json');
    const femalePath = path.join(datasetDir, 'female_tanglish.json');

    console.log('Reading dataset files...');
    let maleData = [];
    let femaleData = [];

    if (fs.existsSync(malePath)) {
      maleData = JSON.parse(fs.readFileSync(malePath, 'utf8'));
    } else {
      console.error(`Male dataset file not found at ${malePath}`);
      process.exit(1);
    }

    if (fs.existsSync(femalePath)) {
      femaleData = JSON.parse(fs.readFileSync(femalePath, 'utf8'));
    } else {
      console.error(`Female dataset file not found at ${femalePath}`);
      process.exit(1);
    }

    console.log(`Loaded local files: ${maleData.length} male entries, ${femaleData.length} female entries.`);

    // Check if gender column is supported by doing a small test insert
    console.log('Verifying gender column support in Supabase...');
    const { error: testErr } = await supabase
      .from('datasets')
      .insert({
        character_id: 'pookie',
        user_query: 'test_temp_check_delete_me',
        assistant_response: 'test_temp_check_delete_me',
        gender: 'male'
      });

    if (testErr) {
      console.error('\n❌ DATABASE SCHEMA BLOCKER DETECTED:');
      console.error(testErr.message);
      console.error('\nPlease execute the following SQL command in your Supabase SQL Editor first:\n');
      console.error('ALTER TABLE public.datasets ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT \'all\';\n');
      process.exit(1);
    } else {
      // Clean up test entry
      await supabase.from('datasets').delete().eq('user_query', 'test_temp_check_delete_me');
      console.log('✅ Database schema supports the "gender" column.');
    }

    // Clear previous uploaded entries to prevent duplicates
    console.log('Clearing existing uploaded male/female dataset entries from database...');
    const { error: clearErr } = await supabase
      .from('datasets')
      .delete()
      .eq('character_id', 'pookie')
      .in('gender', ['male', 'female']);

    if (clearErr) {
      console.warn('Warning during clear:', clearErr.message);
    }

    // Prepare records
    const records = [];
    
    for (const item of maleData) {
      records.push({
        character_id: 'pookie',
        user_query: item.input.trim(),
        assistant_response: item.output.trim(),
        gender: 'male'
      });
    }

    for (const item of femaleData) {
      records.push({
        character_id: 'pookie',
        user_query: item.input.trim(),
        assistant_response: item.output.trim(),
        gender: 'female'
      });
    }

    console.log(`Prepared ${records.length} records to upload...`);

    // Upload in batches of 100 rows
    const batchSize = 100;
    let uploadedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const { error: insertErr } = await supabase
        .from('datasets')
        .insert(batch);

      if (insertErr) {
        console.error(`❌ Batch upload failed at index ${i}:`, insertErr.message);
        throw insertErr;
      }

      uploadedCount += batch.length;
      process.stdout.write(`Uploaded ${uploadedCount}/${records.length} rows...\r`);
    }

    console.log(`\n🎉 Success! Successfully uploaded and trained ${uploadedCount} dialogue rows to the Supabase datasets table.`);

  } catch (err) {
    console.error('\nUpload error:', err);
  }
};

run();
