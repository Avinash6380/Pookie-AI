import express from 'express';
import { supabase } from '../services/supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. GET ALL MEMORIES
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data: memories, error } = await supabase
      .from('memory')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json(memories);
  } catch (err) {
    console.error('Fetch memories error:', err);
    return res.status(500).json({ error: 'Failed to retrieve memories' });
  }
});

// 2. ADD A MEMORY
router.post('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { fact, importance } = req.body;

  if (!fact) {
    return res.status(400).json({ error: 'Memory fact is required' });
  }

  const importanceValue = importance ? parseInt(importance, 10) : 1;

  try {
    const { data: newMemory, error } = await supabase
      .from('memory')
      .insert({
        user_id: userId,
        fact,
        importance: importanceValue
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(newMemory);
  } catch (err) {
    console.error('Add memory error:', err);
    return res.status(500).json({ error: 'Failed to create memory fact' });
  }
});

// 3. DELETE A MEMORY
router.delete('/:id', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // Verify memory belongs to user
    const { data: memory, error: fetchErr } = await supabase
      .from('memory')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchErr || !memory) {
      return res.status(404).json({ error: 'Memory fact not found' });
    }

    if (memory.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this memory' });
    }

    const { error: deleteErr } = await supabase
      .from('memory')
      .delete()
      .eq('id', id);

    if (deleteErr) throw deleteErr;

    return res.json({ success: true, message: 'Memory deleted successfully' });
  } catch (err) {
    console.error('Delete memory error:', err);
    return res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export default router;
