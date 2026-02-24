/**
 * Returns the base URL for all API calls.
 *
 * LOCAL DEV (Express server):
 *   VITE_API_BASE is not set → defaults to '/api'
 *   Calls hit the local Express server at /api/create-content etc.
 *
 * PRODUCTION (Supabase Edge Functions):
 *   Set VITE_API_BASE=https://<project-ref>.supabase.co/functions/v1
 *   in your Netlify environment variables.
 *   Calls hit the Edge Functions at .../create-content etc.
 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
