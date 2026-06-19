import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: join(__dirname, '../.env') });

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is not defined in backend/.env");
    return;
  }
  
  try {
    console.log("Querying available Gemini models for API key...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error("API Error details:", data.error);
      return;
    }
    
    console.log("\n--- Supported Models ---");
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
      });
    } else {
      console.log("No models returned or format mismatch:", data);
    }
  } catch (err) {
    console.error("Network or script error:", err);
  }
}

run();
