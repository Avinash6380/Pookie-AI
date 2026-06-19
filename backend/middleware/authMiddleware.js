import { supabase } from '../services/supabaseClient.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    // Verify user JWT token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request context
    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication Middleware Error:', err);
    return res.status(500).json({ error: 'Internal server authentication error' });
  }
};
