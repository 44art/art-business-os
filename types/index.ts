// art-business-os Ver.1 基本データ型定義

// ─── Brand ───────────────────────────────────────────────

export type Brand = {
  id: string
  name: string           // ブランド名
  activities: string     // 活動内容（スニーカーペイント・箔画など）
  products: string       // 主な商品・サービス
  strengths: string      // 強み・独自性
  targetCustomer: string // 想定顧客
  priceRange: string     // 価格帯
  salesChannel: string   // 販売導線
  // AI生成用補足情報（任意 - 後フェーズで使用）
  type?: 'sneaker' | 'art'
  tone?: string
  hashtags?: string[]
  snsAccounts?: { instagram?: string; x?: string }
  updatedAt: string
}

// ─── Artwork ─────────────────────────────────────────────

export type ArtworkStatus = 'selling' | 'sold' | 'hidden'

export type Artwork = {
  id: string
  title: string          // 作品名
  genre: string          // 作品ジャンル（スニーカーペイント / 箔画 / 抽象画 / その他）
  concept: string        // コンセプト（込めた想い・テーマ）
  features: string       // 特徴（素材・技法・見た目）
  targetCustomer: string // 想定顧客
  price?: number         // 価格（円）
  status: ArtworkStatus  // 販売状態
  // AI生成用補足情報（任意 - 後フェーズで使用）
  brandId?: string
  materials?: string[]
  images?: { url: string; order: number }[]
  tags?: string[]
  createdAt: string
  updatedAt: string
}

// ─── Workshop ────────────────────────────────────────────

export type WorkshopFormat = 'in-person' | 'online' | 'offsite'
export type WorkshopStatus = 'open' | 'full' | 'closed' | 'draft'

export type Workshop = {
  id: string
  title: string          // ワークショップ名
  description: string    // 内容
  targetAudience: string // 対象者
  format: WorkshopFormat // 開催形式
  price: number          // 価格（円/人）
  duration: string       // 所要時間（例："2時間"）
  salesChannel: string   // 集客導線
  status: WorkshopStatus
  // AI生成用補足情報（任意 - 後フェーズで使用）
  brandId?: string
  capacity?: number
  enrolledCount?: number
  location?: string
  images?: { url: string }[]
  createdAt: string
  updatedAt: string
}

// ─── Persona ─────────────────────────────────────────────

export type PersonaSourceType = 'brand' | 'artwork' | 'workshop'

export type Persona = {
  id: string
  // 生成元（ブランド・作品・WS のいずれか）
  sourceType: PersonaSourceType
  sourceId: string
  sourceName: string          // 表示用ラベル
  // 基本属性
  name: string                // ペルソナ名（例："30代アート好き会社員・Aさん"）
  age: string                 // 年齢層
  gender: string              // 性別・家族構成の想定
  occupation: string          // 職業・肩書き
  // 心理情報
  pains: string[]             // 悩み・困りごと
  desires: string[]           // 欲しい未来・理想の状態
  purchaseReason: string      // 購入・参加の理由
  purchaseAnxiety: string     // 購入前の不安
  resonantPhrases: string[]   // 刺さる言葉・キャッチコピー案
  // 行動情報
  usedChannels: string[]      // よく使うSNS・チャネル
  salesChannelFit: string     // 向いている販売導線
  // メタ
  createdAt: string
  updatedAt: string
}

// ─── MarketingAnalysis ───────────────────────────────────

export type MarketingScores = {
  awareness: number
  acquisition: number
  sales: number
  retention: number
}

export type MarketingImprovement = {
  priority: number
  action: string
  effect: string
}

export type MarketingAnalysis = {
  id: string
  brandId: string
  analyzedAt: string
  scores: MarketingScores
  strengths: string[]
  weaknesses: string[]
  improvements: MarketingImprovement[]
  note?: string
}

// ─── ContentDraft ────────────────────────────────────────

export type ContentType =
  | 'sns_post'       // SNS投稿（認知）
  | 'ws_announce'    // WS告知文（集客）
  | 'artwork_sales'  // 作品販売文（販売）
  | 'line_message'   // LINE配信文（リピーター）
  | 'lp_intro'       // LP導入文（販売・集客）

export type MarketingPhaseLink = 'awareness' | 'acquisition' | 'sales' | 'retention'

export type ContentDraft = {
  id: string
  // 紐づくペルソナ
  personaId: string
  personaName: string
  // 紐づく素材
  sourceType: 'brand' | 'artwork' | 'workshop'
  sourceId: string
  sourceName: string
  // コンテンツ種別・フェーズ
  contentType: ContentType
  phaseLink: MarketingPhaseLink
  // 生成コンテキスト（LP作成支援でも再利用）
  targetPerson: string      // 誰に向けた文章か
  addressedPain: string     // どの悩みへのアプローチか
  addressedDesire: string   // どの未来・ゲインへのアプローチか
  strength: string          // 伝えるべき強み
  cta: string               // 行動を促す一文
  salesChannel: string      // 導線
  // 本文
  content: string
  hashtags: string[]
  // メタ
  status: 'draft' | 'saved'
  generatedAt: string
  updatedAt: string
}

// ─── LandingPageDraft ────────────────────────────────────

export type LpGoal =
  | 'artwork_sales'   // 作品販売
  | 'ws_booking'      // WS予約
  | 'inquiry'         // 問い合わせ獲得
  | 'line_register'   // LINE登録
  | 'awareness'       // 認知拡大

export type LpSection = {
  key: string     // hero_headline / sub_copy / reader_pain / etc.
  label: string   // 表示ラベル
  hint: string    // 編集時ガイド
  content: string // 編集可能なテキスト
}

export type LandingPageDraft = {
  id: string
  // 紐づくペルソナ
  personaId: string
  personaName: string
  // 紐づく素材
  sourceType: 'brand' | 'artwork' | 'workshop'
  sourceId: string
  sourceName: string
  // 参照コンテンツ（任意）
  referencedContentId?: string
  // LP設定
  goal: LpGoal
  goalLabel: string
  // LP本体（9セクション）
  sections: LpSection[]
  // LINE活用支援への引き継ぎデータ
  lineCtaText: string          // LINEへの誘導文
  lineRegistrationUrl: string  // LINE登録URL（任意）
  // メタ
  status: 'draft' | 'saved'
  generatedAt: string
  updatedAt: string
}

// ─── LineStrategyDraft ───────────────────────────────────

export type LineGoal =
  | 'ws_booking'     // ワークショップ予約
  | 'artwork_sales'  // 作品販売
  | 'inquiry'        // 問い合わせ獲得
  | 'repeat'         // リピーター化
  | 'fan'            // ファン化

export type LineSection = {
  key: string     // line_register_copy / greeting_message / etc.
  label: string   // 表示ラベル
  hint: string    // 編集時ガイド
  content: string // 編集可能なテキスト
}

export type LineStrategyDraft = {
  id: string
  // 紐づくペルソナ
  personaId: string
  personaName: string
  // 紐づく素材
  sourceType: 'brand' | 'artwork' | 'workshop'
  sourceId: string
  sourceName: string
  // 参照データ（任意）
  referencedContentId?: string
  referencedLpId?: string
  // LINE設定
  goal: LineGoal
  goalLabel: string
  lineRegistrationUrl: string  // LINE登録URL（任意）
  // LINE導線案（8セクション）
  sections: LineSection[]
  // SNS戦略への引き継ぎデータ
  recommendedChannels: string[]  // LINE誘導に使うおすすめSNSチャネル
  snsCtaText: string             // SNS投稿でのLINE誘導文言
  // メタ
  status: 'draft' | 'saved'
  generatedAt: string
  updatedAt: string
}

// ─── ConsultantReport ────────────────────────────────────

export type ConsultantPhaseItem = {
  phase: MarketingPhaseLink
  phaseLabel: string
  done: string[]         // できていること
  missing: string[]      // 足りていないこと
  improvements: string[] // 改善すべきこと
  nextActions: string[]  // 次にやるべき具体的アクション
}

export type ConsultantReport = {
  id: string
  // 診断対象
  sourceType: 'brand' | 'artwork' | 'workshop'
  sourceId: string
  sourceName: string
  // フェーズ別診断（4フェーズ）
  phases: ConsultantPhaseItem[]
  // 全体診断
  topPriority: string      // 最優先で改善すべきポイント
  quickWin: string         // 売上につながりやすい次の一手
  activeFlows: string[]    // 今すぐ使える導線
  weakFlows: string[]      // まだ弱い導線
  contentIdeas: string[]   // 今後作るべきコンテンツ案
  // AI注記（必須表示）
  aiDisclaimer: string
  // メタ
  status: 'draft' | 'saved'
  generatedAt: string
  updatedAt: string
}

// ─── SNSStrategy（旧型・互換保持）────────────────────────

export type SNSGoal = 'awareness' | 'acquisition' | 'sales'
export type SNSPlatform = 'instagram' | 'x'

export type SNSStrategy = {
  id: string
  brandId: string
  platform: SNSPlatform
  goal: SNSGoal
  weeklyFrequency: number
  themes: string[]
  hashtags: string[]
  updatedAt: string
}

// ─── SnsStrategyDraft（新型）─────────────────────────────

export type SnsStrategyGoal =
  | 'awareness'      // 認知拡大
  | 'ws_booking'     // WS集客
  | 'artwork_sales'  // 作品販売
  | 'line_register'  // LINE登録
  | 'fan'            // ファン化
  | 'repeat'         // リピーター化

export type SnsStrategyPlatform =
  | 'x'           // X
  | 'instagram'   // Instagram
  | 'facebook'    // Facebook
  | 'youtube'     // YouTube
  | 'tiktok'      // TikTok
  | 'threads'     // Threads

export type SnsStrategySection = {
  key: string
  label: string
  hint: string
  content: string
}

export type SnsStrategyDraft = {
  id: string
  // 紐づくペルソナ
  personaId: string
  personaName: string
  // 紐づく素材
  sourceType: 'brand' | 'artwork' | 'workshop'
  sourceId: string
  sourceName: string
  // 参照データ（任意）
  referencedContentId?: string
  referencedLpId?: string
  referencedLineId?: string
  // SNS設定
  goal: SnsStrategyGoal
  goalLabel: string
  platforms: SnsStrategyPlatform[]
  // SNS戦略案（8セクション）
  sections: SnsStrategySection[]
  // AIコンサルタントへの引き継ぎデータ
  marketingPhaseLink: MarketingPhaseLink
  weeklyPostCount: number  // 週間投稿数（目安）
  primaryCta: string       // 主要CTA文言
  // メタ
  status: 'draft' | 'saved'
  generatedAt: string
  updatedAt: string
}
