import express from 'express';
import { supabase } from '../services/supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. GET SETTINGS (USER PREFERENCES)
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    let { data: preferences, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !preferences) {
      // Create default preferences if they don't exist
      const { data: newPref, error: newPrefErr } = await supabase
        .from('preferences')
        .insert({ user_id: userId, assistant_name: 'Pookie', personality: 'Romantic', theme: 'dark' })
        .select()
        .single();

      if (newPrefErr) throw newPrefErr;
      preferences = newPref;
    }

    return res.json(preferences);
  } catch (err) {
    console.error('Fetch settings error:', err);
    return res.status(500).json({ error: 'Failed to retrieve preferences settings' });
  }
});

// 2. UPDATE SETTINGS
router.put('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { assistant_name, personality, theme } = req.body;

  try {
    const updateData = {};
    if (assistant_name !== undefined) updateData.assistant_name = assistant_name;
    if (personality !== undefined) updateData.personality = personality;
    if (theme !== undefined) updateData.theme = theme;

    const { data: updatedPref, error } = await supabase
      .from('preferences')
      .upsert({ user_id: userId, ...updateData })
      .select()
      .single();

    if (error) throw error;

    return res.json(updatedPref);
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to update preferences settings' });
  }
});

export default router;
