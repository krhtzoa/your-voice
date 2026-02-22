import { supabase } from './supabase.js'

/**
 * @param {{ content: string, prompt?: string, platform?: string, durationSeconds?: number }} script
 * @returns {Promise<{ id: string }>}
 */
export async function saveScript(script) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('scripts')
    .insert({
      user_id: user.id,
      content: script.content,
      prompt: script.prompt ?? null,
      platform: script.platform ?? null,
      duration_seconds: script.durationSeconds ?? null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return { id: data.id }
}

/**
 * @returns {Promise<Array<{ id: string, content: string, prompt: string | null, platform: string | null, duration_seconds: number | null, created_at: string }>>}
 */
export async function fetchScripts() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('scripts')
    .select('id, content, prompt, platform, duration_seconds, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
