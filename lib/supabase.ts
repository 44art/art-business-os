// Supabase接続設定
// 実装時は .env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定すること

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// TODO: 次フェーズで @supabase/supabase-js をインストールして有効化する
// import { createClient } from '@supabase/supabase-js'
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)
