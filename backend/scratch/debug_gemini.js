import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
console.log('Using API Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'Not Found');

const genAI = new GoogleGenerativeAI(apiKey || '');

async function test(modelName) {
  console.log(`Testing model: ${modelName}`);
  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: "You are a helpful assistant. Respond in one brief sentence."
    });

    const chatSession = model.startChat({
      history: []
    });

    const result = await chatSession.sendMessage("hi");
    console.log(`  🟢 SUCCESS [${modelName}]: "${result.response.text().trim()}"`);
    return true;
  } catch (error) {
    console.log(`  🔴 FAILED [${modelName}]: ${error.message || error}`);
    return false;
  }
}

async function run() {
  await test('gemini-flash-lite-latest');
  await test('gemini-1.5-pro-latest');
  await test('gemini-1.5-pro-001');
  await test('gemini-1.5-pro-002');
  await test('gemini-1.5-pro');
}

run();
