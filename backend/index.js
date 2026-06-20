import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { supabase } from './services/supabaseClient.js';

// Route imports
import chatRouter from './routes/chat.js';
import profileRouter from './routes/profile.js';
import settingsRouter from './routes/settings.js';
import memoriesRouter from './routes/memories.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // In production, restrict this to your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// API Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mount Routes
app.use('/api/chat', chatRouter);
app.use('/api/profile', profileRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/memories', memoriesRouter);

// POST /api/auth/register - Register a user via Supabase admin client (auto-confirm email)
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username }
    });

    if (error) {
      console.log('Admin signup error details:', error);
      let errMsg = error.message;
      if (!errMsg || errMsg === '{}' || errMsg === 'null') {
        errMsg = 'Email address was rejected by the SMTP server or is in an invalid format. Please try a different email address.';
      }
      return res.status(400).json({ error: errMsg });
    }

    return res.json({ success: true, user: data.user });
  } catch (err) {
    console.error('Registration routing error:', err);
    return res.status(500).json({ error: 'Failed to complete registration' });
  }
});

// GET /api/characters - Fetch all available AI characters
app.get('/api/characters', async (req, res) => {
  try {
    const { data: characters, error } = await supabase
      .from('characters')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return res.json(characters);
  } catch (err) {
    console.error('Fetch characters error:', err);
    return res.status(500).json({ error: 'Failed to retrieve characters list' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Pookie AI backend server running on port ${PORT}`);
  
  // Verify message_reactions table existence on startup
  try {
    const { error } = await supabase.from('message_reactions').select('id').limit(1);
    if (error && error.code === '42P01') {
      console.warn('\n⚠️  WARNING: The "message_reactions" table does not exist in your Supabase database!');
      console.warn('Please run the following SQL schema in your Supabase SQL Editor:');
      console.warn(`
      CREATE TABLE IF NOT EXISTS public.message_reactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
          user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
          reaction VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id)
      );\n`);
    } else {
      console.log('✅ Supabase "message_reactions" table verified.');
    }
  } catch (err) {
    console.error('Failed to verify message_reactions table on startup:', err.message);
  }
});
