/**
 * Voice rules CRUD helpers for Supabase.
 * RLS enforces user isolation; pass userId for clarity.
 */
import { supabase } from './supabase.js'

export const RULE_TYPES = [
  { value: 'avoid', label: 'Avoid' },
  { value: 'prefer', label: 'Prefer' },
  { value: 'never', label: 'Never' },
  { value: 'tone', label: 'Tone' },
  { value: 'style', label: 'Style' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'phrasing', label: 'Phrasing' },
  { value: 'speech_patterns', label: 'Speech Patterns' },
  { value: 'non_negotiables', label: 'Non-Negotiables' },
  { value: 'general', label: 'General' },
]

export async function fetchRules(userId) {
  if (!supabase || !userId) return { data: [], error: new Error('Missing supabase or userId') }
  const { data, error } = await supabase
    .from('voice_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function createRule(userId, { content, rule_type, source = 'manual', category = 'voice' }) {
  if (!supabase || !userId) return { data: null, error: new Error('Missing supabase or userId') }
  const { data, error } = await supabase
    .from('voice_rules')
    .insert({
      user_id: userId,
      content: content.trim(),
      rule_type,
      source: source === 'feedback' ? 'feedback' : 'manual',
      category: category === 'expertise' ? 'expertise' : 'voice',
    })
    .select()
    .single()
  return { data, error }
}

export async function updateRule(userId, ruleId, { content, rule_type }) {
  if (!supabase || !userId || !ruleId) return { data: null, error: new Error('Missing params') }
  const { data, error } = await supabase
    .from('voice_rules')
    .update({
      content: content.trim(),
      rule_type,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .eq('user_id', userId)
    .select()
    .single()
  return { data, error }
}

export async function deleteRule(userId, ruleId) {
  if (!supabase || !userId || !ruleId) return { error: new Error('Missing params') }
  const { error } = await supabase
    .from('voice_rules')
    .delete()
    .eq('id', ruleId)
    .eq('user_id', userId)
  return { error }
}
