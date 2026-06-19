import express from 'express';
import { supabase } from '../services/supabaseClient.js';
import { loadDatasets } from '../services/datasetMatcher.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. PREVIEW DATASET ENTRIES
router.get('/:characterId', requireAuth, async (req, res) => {
  const { characterId } = req.params;

  try {
    const { data: entries, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.message?.includes("does not exist")) {
        return res.status(404).json({ error: 'Database table "datasets" not found. Please execute the SQL addendum schema first.' });
      }
      throw error;
    }

    return res.json(entries);
  } catch (err) {
    console.error('Fetch dataset preview error:', err);
    return res.status(500).json({ error: 'Failed to retrieve dataset entries' });
  }
});

// 2. UPLOAD/REPLACE DATASET
router.post('/upload', requireAuth, async (req, res) => {
  const { characterId, entries, overwrite } = req.body;

  if (!characterId || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'characterId and entries array are required' });
  }

  // Validate format
  const validatedEntries = [];
  for (const entry of entries) {
    const query = entry.user || entry.user_query;
    const response = entry.assistant || entry.assistant_response;

    if (!query || !response) {
      return res.status(400).json({ error: 'Each entry must contain a "user" (query) and an "assistant" (response) property.' });
    }

    validatedEntries.push({
      character_id: characterId,
      user_query: query.trim(),
      assistant_response: response.trim()
    });
  }

  try {
    // If overwrite is requested, clear character's current entries
    if (overwrite) {
      const { error: deleteErr } = await supabase
        .from('datasets')
        .delete()
        .eq('character_id', characterId);

      if (deleteErr) throw deleteErr;
    }

    // Insert entries in batches of 100 for safety and efficiency
    const batchSize = 100;
    for (let i = 0; i < validatedEntries.length; i += batchSize) {
      const batch = validatedEntries.slice(i, i + batchSize);
      const { error: insertErr } = await supabase
        .from('datasets')
        .insert(batch);

      if (insertErr) throw insertErr;
    }

    // Rebuild the global in-memory index
    const reloadSuccess = await loadDatasets();

    return res.json({
      success: true,
      message: `Successfully uploaded ${validatedEntries.length} dataset rows. Index reloaded: ${reloadSuccess}`,
      count: validatedEntries.length
    });

  } catch (err) {
    console.error('Upload dataset error:', err);
    return res.status(500).json({ error: 'Failed to upload and update companion dataset' });
  }
});

// 3. FORCE CACHE RELOAD
router.post('/reload', requireAuth, async (req, res) => {
  try {
    const success = await loadDatasets();
    return res.json({ success, message: success ? 'Dataset indexes reloaded successfully' : 'Failed to reload dataset indexes' });
  } catch (err) {
    console.error('Reload cache error:', err);
    return res.status(500).json({ error: 'Failed to reload index cache' });
  }
});

export default router;
