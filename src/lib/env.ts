export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
