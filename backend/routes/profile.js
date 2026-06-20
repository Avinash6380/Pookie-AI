import express from 'express';
import { supabase } from '../services/supabaseClient.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to get onboarding memory details
const getOnboardingMemories = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.warn('Could not query user_memory table (it may not exist yet):', error.message);
      return { user_name: null, gender: null };
    }

    const memories = {};
    if (data) {
      for (const m of data) {
        memories[m.memory_key] = m.memory_value;
      }
    }
    return {
      user_name: memories.user_name || null,
      gender: memories.gender || null
    };
  } catch (err) {
    console.error('Error fetching onboarding memories:', err);
    return { user_name: null, gender: null };
  }
};

// 1. GET PROFILE DATA (Includes User Name & Gender memories)
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;

  try {
    const [userRes, streakRes, countRes, relsRes, onboardingMem, progressRes] = await Promise.all([
      // Fetch user profile info
      supabase.from('users').select('*').eq('id', userId).single(),
      // Fetch daily streak
      supabase.from('streaks').select('streak_count').eq('user_id', userId).single(),
      // Fetch total chat count (messages sent by user)
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user'),
      // Fetch relationship levels with characters
      supabase.from('relationships').select('level, xp, character_id').eq('user_id', userId),
      // Fetch user name and gender from user_memory table
      getOnboardingMemories(userId),
      // Fetch relationship progress
      supabase.from('relationship_progress').select('*').eq('user_id', userId)
    ]);

    if (userRes.error) {
      throw userRes.error;
    }

    const streakCount = streakRes.data ? streakRes.data.streak_count : 1;
    const chatCount = countRes.count || 0;
    const relationships = relsRes.data || [];
    const progress = progressRes.data || [];

    // Form response payload
    return res.json({
      id: userRes.data.id,
      username: userRes.data.username,
      email: userRes.data.email,
      avatar: userRes.data.avatar,
      createdAt: userRes.data.created_at,
      streakCount,
      chatCount,
      relationships,
      userName: onboardingMem.user_name,
      gender: onboardingMem.gender,
      relationshipProgress: progress
    });
  } catch (err) {
    console.error('Fetch profile stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve profile information' });
  }
});

// 2. UPDATE PROFILE DATA
router.put('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { username, avatar } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const updateData = { username };
    if (avatar) {
      updateData.avatar = avatar;
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return res.json(updatedUser);
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile information' });
  }
});

// 3. GET ONBOARDING STATUS
router.get('/onboarding', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const onboarding = await getOnboardingMemories(userId);
  const onboarded = !!(onboarding.user_name && onboarding.gender);
  return res.json({
    onboarded,
    userName: onboarding.user_name,
    gender: onboarding.gender
  });
});

// 4. SUBMIT ONBOARDING DATA (Name & Gender)
router.post('/onboarding', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { name, gender } = req.body;

  if (!name || !gender) {
    return res.status(400).json({ error: 'Both name and gender are required for onboarding' });
  }

  try {
    // 1. Save to user_memory table
    const { error: nameErr } = await supabase
      .from('user_memory')
      .upsert(
        { user_id: userId, memory_key: 'user_name', memory_value: name.trim() },
        { onConflict: 'user_id,memory_key' }
      );

    const { error: genderErr } = await supabase
      .from('user_memory')
      .upsert(
        { user_id: userId, memory_key: 'gender', memory_value: gender.trim() },
        { onConflict: 'user_id,memory_key' }
      );

    if (nameErr || genderErr) {
      throw new Error(nameErr?.message || genderErr?.message || 'Error inserting onboarding memories');
    }

    // 2. Add AI memory fact: "User's name is {name}."
    const nameFact = `User's name is ${name.trim()}.`;
    await supabase
      .from('memory')
      .insert({ user_id: userId, fact: nameFact, importance: 5 });

    // 3. Add AI memory fact: "User's gender is {gender}."
    const genderFact = `User's gender is ${gender.trim()}.`;
    await supabase
      .from('memory')
      .insert({ user_id: userId, fact: genderFact, importance: 4 });

    return res.json({ success: true, message: 'Onboarding data saved successfully' });
  } catch (err) {
    console.error('Submit onboarding error:', err);
    return res.status(500).json({ error: 'Failed to save onboarding data. Please run the SQL schema addendum in Supabase.' });
  }
});

// 5. UPDATE USER NAME (From Settings)
router.post('/name', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'User name is required' });
  }

  try {
    // 1. Update user name in user_memory
    const { error: nameErr } = await supabase
      .from('user_memory')
      .upsert(
        { user_id: userId, memory_key: 'user_name', memory_value: name.trim() },
        { onConflict: 'user_id,memory_key' }
      );

    if (nameErr) throw nameErr;

    // 2. Swap old memory fact for name in memory table
    // A. Fetch existing memories containing "User's name is"
    const { data: existingMemories } = await supabase
      .from('memory')
      .select('*')
      .eq('user_id', userId)
      .like('fact', 'User\'s name is %');

    const newFact = `User's name is ${name.trim()}.`;

    if (existingMemories && existingMemories.length > 0) {
      // B. Update the first matched fact
      const targetId = existingMemories[0].id;
      await supabase
        .from('memory')
        .update({ fact: newFact })
        .eq('id', targetId);
      
      // Delete any duplicates if they exist
      if (existingMemories.length > 1) {
        const duplicateIds = existingMemories.slice(1).map(m => m.id);
        await supabase
          .from('memory')
          .delete()
          .in('id', duplicateIds);
      }
    } else {
      // C. Insert new fact if not found
      await supabase
        .from('memory')
        .insert({ user_id: userId, fact: newFact, importance: 5 });
    }

    return res.json({ success: true, message: 'User name updated and memory synced successfully' });
  } catch (err) {
    console.error('Update username memory error:', err);
    return res.status(500).json({ error: 'Failed to update username' });
  }
});

export default router;
