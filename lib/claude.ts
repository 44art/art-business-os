// Claude API接続設定
// 実装時は .env.local に ANTHROPIC_API_KEY を設定すること（サーバーサイド専用）

export const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? ''

// TODO: 次フェーズでコンテンツ生成・AI分析機能実装時に有効化する
// import Anthropic from '@anthropic-ai/sdk'
// export const anthropic = new Anthropic({ apiKey: anthropicApiKey })
