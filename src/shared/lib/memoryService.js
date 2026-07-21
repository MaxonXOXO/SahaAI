import { supabase } from './supabaseClient';
import { getEmbedding } from './aiClient';

/**
 * Save a new diary entry.
 * @param {string} content - Journal entry text
 * @param {string|null} moodTag - Optional mood tag (e.g., '😊 Happy')
 * @param {string} userId - Auth user UUID
 */
export async function saveDiaryEntry(content, moodTag, userId) {
  if (!content || !content.trim()) {
    return { data: null, error: new Error('Content cannot be empty') };
  }
  const { data, error } = await supabase
    .from('diary_entries')
    .insert({ user_id: userId, content: content.trim(), mood_tag: moodTag || null })
    .select();
  return { data, error };
}

/**
 * Save a new memory note along with its 768-dim vector embedding.
 * @param {string} content - Memory note text (e.g. "kept keys in blue bag")
 * @param {string} userId - Auth user UUID
 */
export async function saveMemoryNote(content, userId) {
  if (!content || !content.trim()) {
    return { data: null, error: new Error('Content cannot be empty') };
  }
  try {
    const embedding = await getEmbedding(content.trim());
    const { data, error } = await supabase
      .from('memory_notes')
      .insert({ user_id: userId, content: content.trim(), embedding })
      .select();
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Perform natural-language cosine similarity search against stored memory notes.
 * @param {string} question - Search query string
 * @param {string} userId - Auth user UUID
 * @param {number} threshold - Similarity threshold (default: 0.75)
 * @param {number} count - Maximum match count (default: 3)
 */
export async function queryMemory(question, userId, threshold = 0.75, count = 3) {
  if (!question || !question.trim()) {
    return { data: [], error: null };
  }
  try {
    const questionEmbedding = await getEmbedding(question.trim());
    const { data, error } = await supabase.rpc('match_memory_notes', {
      query_embedding: questionEmbedding,
      match_user_id: userId,
      match_threshold: threshold,
      match_count: count
    });
    return { data, error };
  } catch (err) {
    return { data: null, error: err };
  }
}

/**
 * Fetch past diary entries, most recent first.
 * @param {string} userId - Auth user UUID
 */
export async function getDiaryEntries(userId) {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

/**
 * Fetch all memory notes for the user, most recent first.
 * @param {string} userId - Auth user UUID
 */
export async function getAllMemoryNotes(userId) {
  const { data, error } = await supabase
    .from('memory_notes')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}
