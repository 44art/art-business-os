import type { Brand, Artwork, Workshop } from '@/types'

// ─── 分析結果の型定義 ───────────────────────────────────

export type AnalysisSourceType = 'brand' | 'artwork' | 'workshop'

export type PersonaHints = {
  targetDescription: string  // 想定顧客の概要（ペルソナ作成の初期値に使う）
  needs: string[]            // ニーズ・欲求
  desiredChannels: string[]  // 接触チャネル
}

export type AnalysisResult = {
  id: string
  sourceType: AnalysisSourceType
  sourceId: string
  sourceLabel: string
  analyzedAt: string
  // 8つの分析カテゴリ
  targetCustomer: string      // 想定顧客
  strengths: string[]         // 強み
  salesDirection: string      // 売り方の方向性
  awareness: string[]         // 認知施策
  acquisition: string[]       // 集客施策
  salesChannelPlan: string[]  // 販売導線
  retention: string[]         // リピーター化施策
  nextActions: string[]       // 次にやるべきアクション（優先度順）
  // ペルソナ作成への接続情報
  personaHints: PersonaHints
}

// ─── メイン関数 ────────────────────────────────────────

export function analyzeTarget(
  type: AnalysisSourceType,
  source: Brand | Artwork | Workshop
): AnalysisResult {
  switch (type) {
    case 'brand':    return analyzeBrand(source as Brand)
    case 'artwork':  return analyzeArtwork(source as Artwork)
    case 'workshop': return analyzeWorkshop(source as Workshop)
  }
}

// ─── ブランド分析 ───────────────────────────────────────

function analyzeBrand(brand: Brand): AnalysisResult {
  const strengths = parseLines(brand.strengths)
  const hasInstagram = brand.salesChannel?.toLowerCase().includes('instagram')
  const hasLINE = brand.salesChannel?.toLowerCase().includes('line')

  const awareness = [
    'Instagramで制作過程・完成作品を週2〜3回投稿する',
    'Xで作家としての想い・日常をつぶやいてファンを増やす',
    brand.activities
      ? `「${brand.activities}」のストーリーを発信して興味・共感を集める`
      : '活動のストーリーを発信して共感を集める',
    'noteで制作背景・こだわりを長文発信する（Google検索からの流入にも効果）',
  ]

  const acquisition = [
    'Instagramプロフィールリンクを整備して問い合わせ・購入ページへ誘導する',
    'InstagramストーリーズでWSや新作情報を告知する（スワイプアップでLP誘導）',
    '購入者・参加者に写真シェアとタグ付けをお願いして口コミを広げる',
    'フォロワー向け限定オファー（先行予約・割引）で行動を促す',
  ]

  const salesChannelItems = brand.salesChannel
    ? [
        `現在の導線：${brand.salesChannel}`,
        hasLINE ? 'LINE公式アカウントの友だち登録への誘導を強化する' : 'LINE公式アカウントを導線に追加する',
        '申込フォームまたは購入ページへの導線を明確にする',
      ]
    : [
        'DM受付 → 見積もり確認 → 銀行振込 or Stripe決済',
        'LINE公式アカウントで問い合わせを受け付ける',
        'Google Forms等の申込フォームを整備する',
      ]

  const retention = [
    hasLINE
      ? 'LINE公式で新作・WS情報を定期配信してリピーターを育てる'
      : 'LINE公式アカウントに購入者・参加者を誘導して継続的に情報を届ける',
    '購入後・参加後に感謝メッセージ＋次回案内を送る',
    'リピーター向け特典（優先案内・割引・限定枠）を設ける',
    '季節やイベントに合わせた新作・企画を告知する',
  ]

  const nextActions = buildBrandNextActions(brand)

  return {
    id: generateId(),
    sourceType: 'brand',
    sourceId: brand.id,
    sourceLabel: brand.name,
    analyzedAt: new Date().toISOString(),
    targetCustomer: brand.targetCustomer || '想定顧客を登録してください',
    strengths: strengths.length > 0 ? strengths : ['強み・独自性を登録してください'],
    salesDirection: buildBrandSalesDirection(brand),
    awareness,
    acquisition,
    salesChannelPlan: salesChannelItems,
    retention,
    nextActions,
    personaHints: {
      targetDescription: brand.targetCustomer || '（ブランドの想定顧客を登録してください）',
      needs: extractBrandNeeds(brand),
      desiredChannels: ['Instagram', 'X', 'LINE'],
    },
  }
}

// ─── 作品分析 ───────────────────────────────────────────

function analyzeArtwork(artwork: Artwork): AnalysisResult {
  const strengths: string[] = []
  if (artwork.genre)    strengths.push(`ジャンル：${artwork.genre}`)
  if (artwork.concept)  strengths.push(`コンセプト：${artwork.concept}`)
  if (artwork.features) strengths.push(`特徴：${artwork.features}`)
  if (artwork.price)    strengths.push(`価格：¥${artwork.price.toLocaleString()}（一点物）`)

  const genre = artwork.genre || 'アート作品'
  const priceText = artwork.price ? `¥${artwork.price.toLocaleString()}` : '価格要相談'

  const awareness = [
    `${genre}の制作過程をリール・動画で発信する（完成までのプロセスは高エンゲージメント）`,
    '完成作品を魅力的なライティングで撮影してInstagramに投稿する',
    '制作ストーリー・込めた想いをキャプションに書いて共感を集める',
    artwork.genre?.includes('スニーカー')
      ? 'カスタム前後のビフォー・アフターを見せると拡散しやすい'
      : '作品を実際の空間に飾ったイメージ写真を撮影して投稿する',
  ]

  const acquisition = [
    `この作品の販売LP（${priceText}）を作成して、プロフィールリンクから誘導する`,
    'InstagramストーリーズやXで「購入はDMまで」と呼びかける',
    'ギフト用途を訴求する（誕生日・結婚祝い・記念日プレゼント）',
    `${artwork.targetCustomer ? artwork.targetCustomer + 'に刺さる訴求' : '想定顧客のニーズに刺さる訴求'}でLPを作る`,
  ]

  const salesChannelItems = [
    `Instagram DM → 見積もり確認 → 銀行振込 or Stripe決済（${priceText}）`,
    'LP（ランディングページ）に購入フォームまたは問い合わせ窓口を設ける',
    artwork.status === 'selling'
      ? `現在販売中 → 購入までの流れをLP上で明示する`
      : artwork.status === 'sold'
        ? '売却済 → 類似作品の制作受注やカスタムオーダーを告知する'
        : '非公開中 → 公開タイミングと価格を決めて準備を進める',
  ]

  const retention = [
    '購入者をLINE公式に誘導して次回新作を先行通知する',
    '購入後1週間に「飾ってみた感想」をDMで確認して関係を続ける',
    '購入者限定で次回作の先行予約権を提供する',
    '購入者の写真・感想をInstagramに投稿して口コミを可視化する（要許可）',
  ]

  return {
    id: generateId(),
    sourceType: 'artwork',
    sourceId: artwork.id,
    sourceLabel: artwork.title,
    analyzedAt: new Date().toISOString(),
    targetCustomer: artwork.targetCustomer || `${genre}に興味がある方`,
    strengths: strengths.length > 0 ? strengths : ['作品情報を登録してください'],
    salesDirection: `${genre}の一点物作品（${priceText}）として、制作ストーリーと世界観で付加価値を高め、「この作家の作品が欲しい」というファンを作る。LPを軸に購入導線を整備する。`,
    awareness,
    acquisition,
    salesChannelPlan: salesChannelItems,
    retention,
    nextActions: buildArtworkNextActions(artwork),
    personaHints: {
      targetDescription: artwork.targetCustomer || `${genre}が好きな方`,
      needs: extractArtworkNeeds(artwork),
      desiredChannels: ['Instagram', 'X'],
    },
  }
}

// ─── ワークショップ分析 ─────────────────────────────────

function analyzeWorkshop(ws: Workshop): AnalysisResult {
  const formatLabel: Record<string, string> = {
    'in-person': '対面（会場）',
    online: 'オンライン',
    offsite: '出張',
  }
  const format = formatLabel[ws.format] || ws.format
  const priceText = ws.price > 0 ? `¥${ws.price.toLocaleString()}/人` : '無料'

  const strengths: string[] = []
  strengths.push(`開催形式：${format}`)
  if (ws.price > 0)       strengths.push(`参加費：${priceText}`)
  if (ws.duration)        strengths.push(`所要時間：${ws.duration}`)
  if (ws.targetAudience)  strengths.push(`対象：${ws.targetAudience}`)
  if (ws.description)     strengths.push(`内容：${ws.description.slice(0, 60)}${ws.description.length > 60 ? '…' : ''}`)

  const awareness = [
    `WS開催中の様子・完成した作品をInstagramに投稿する`,
    '参加者の「楽しかった」「うまくできた」という瞬間を発信する',
    `「${ws.title}」を体験する様子をリール動画で撮影・投稿する`,
    '参加者にInstagramでタグ付け投稿をお願いして口コミを広げる',
  ]

  const acquisition = [
    `このWSのLPを作成し、「${ws.targetAudience || '参加対象者'}向け」の訴求でプロフィールリンクに設定する`,
    'InstagramストーリーズやXで「残席○席」と緊急性を伝える',
    ws.salesChannel
      ? `現在の集客導線：${ws.salesChannel}`
      : 'Google Forms等の申込フォームを作りSNSから誘導する',
    'LINE公式やメルマガリストに向けてWS開催告知を送る',
  ]

  const salesChannelItems = ws.salesChannel
    ? [
        `登録済み導線：${ws.salesChannel}`,
        '申込フォームへの導線をInstagramプロフィールに設定する',
        'LINEからの予約受付を追加してリマインド配信を行う',
      ]
    : [
        'Instagram → プロフィールリンク → 申込フォーム（Google Forms）',
        '申込完了後にLINE公式へ誘導してリマインド配信する',
        '当日・終了後の案内を自動化する仕組みを作る',
      ]

  const retention = [
    'WS終了後に全参加者にLINE公式経由でお礼メッセージを送る',
    '次回WS案内を参加者に先行配信する（リピート参加を促す）',
    '参加者の作品写真を許可を得てInstagramに投稿し口コミを可視化する',
    'リピーター特典（2回目割引・限定先行枠）を設けて継続参加を促す',
  ]

  return {
    id: generateId(),
    sourceType: 'workshop',
    sourceId: ws.id,
    sourceLabel: ws.title,
    analyzedAt: new Date().toISOString(),
    targetCustomer: ws.targetAudience || 'ワークショップ参加に興味がある方',
    strengths: strengths.length > 0 ? strengths : ['WS情報を登録してください'],
    salesDirection: `${format}形式・${priceText}の体験型WSとして、「参加後の感動・達成感」をSNSで発信して集客する。参加者をLINEに誘導してリピーター化と口コミ拡散を狙う。`,
    awareness,
    acquisition,
    salesChannelPlan: salesChannelItems,
    retention,
    nextActions: buildWorkshopNextActions(ws),
    personaHints: {
      targetDescription: ws.targetAudience || 'WS参加に興味がある方',
      needs: extractWorkshopNeeds(ws),
      desiredChannels: ['Instagram', 'LINE'],
    },
  }
}

// ─── ヘルパー関数 ───────────────────────────────────────

function parseLines(text: string): string[] {
  if (!text) return []
  return text.split(/[。\n]/).map((s) => s.trim()).filter(Boolean)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function buildBrandSalesDirection(brand: Brand): string {
  const price = brand.priceRange ? `（価格帯：${brand.priceRange}）` : ''
  const product = brand.products || brand.activities || 'アート作品・ワークショップ'
  return `${product}${price}を軸に、SNSでのストーリー発信 → プロフィールリンク → 問い合わせ・購入 → LINE誘導でリピーターへというマーケティングファネルを構築する。`
}

function buildBrandNextActions(brand: Brand): string[] {
  const now: string[] = []
  const next: string[] = []
  const later: string[] = []

  if (!brand.targetCustomer) now.push('[今すぐ] ブランド管理で「想定顧客」を具体的に記入する')
  if (!brand.strengths)      now.push('[今すぐ] ブランド管理で「強み・独自性」を記入する')
  if (!brand.salesChannel)   now.push('[今すぐ] ブランド管理で「販売導線」（Instagram→LP→決済 等）を整備する')

  if (brand.targetCustomer && brand.strengths) {
    now.push('[今すぐ] ペルソナ作成でブランドの顧客像を1件定義する')
  }
  next.push('[次に整える] Instagramプロフィール文とプロフィールリンクを整備する')
  next.push('[次に整える] コンテンツ生成でSNS投稿文を1件作成し、今週から投稿を開始する')
  later.push('[後で検討] AIコンサルタントでマーケティング導線全体を診断する')

  return [...now, ...next, ...later].slice(0, 5)
}

function buildArtworkNextActions(artwork: Artwork): string[] {
  const now: string[] = []
  const next: string[] = []
  const later: string[] = []

  if (!artwork.targetCustomer) now.push('[今すぐ] 作品管理で「想定顧客」（誰に買ってほしいか）を記入する')
  if (!artwork.features)       now.push('[今すぐ] 作品管理で「特徴」（素材・技法・見た目）を記入する')
  now.push('[今すぐ] コンテンツ生成でこの作品の「SNS投稿文」を1件作成する')

  if (artwork.status === 'selling') {
    next.push('[次に整える] LP作成支援でこの作品の販売LPを作成し、プロフィールリンクに設定する')
  }
  next.push('[次に整える] ペルソナ作成でこの作品の想定顧客像を1件定義する')
  later.push('[後で検討] 制作過程の写真・動画をInstagramのReelsとして投稿する')

  return [...now, ...next, ...later].slice(0, 5)
}

function buildWorkshopNextActions(ws: Workshop): string[] {
  const now: string[] = []
  const next: string[] = []
  const later: string[] = []

  if (!ws.targetAudience) now.push('[今すぐ] WS管理で「対象者」（誰向けのWSか）を具体的に記入する')
  if (!ws.salesChannel)   now.push('[今すぐ] WS管理で「集客導線」（Instagram→フォーム 等）を整備する')
  if (ws.status === 'draft') now.push('[今すぐ] WS管理でステータスを「募集中」に変更する')

  next.push('[次に整える] コンテンツ生成でこのWSの「告知文」を1件作成してSNSに投稿する')
  next.push('[次に整える] LP作成支援でWS予約LPを作成し、プロフィールリンクに設定する')
  later.push('[後で検討] LINE活用支援でWS参加者向けのLINEシナリオを作成する')

  return [...now, ...next, ...later].slice(0, 5)
}

function extractBrandNeeds(brand: Brand): string[] {
  const needs = ['世界に一つだけの作品・体験を求めている', '作り手の想いやストーリーに共感したい']
  if (brand.activities?.includes('スニーカー')) {
    needs.push('自分らしいスタイルを表現したい')
    needs.push('スニーカーコレクションに個性を加えたい')
  }
  if (brand.activities?.includes('箔') || brand.activities?.includes('抽象')) {
    needs.push('空間を彩るアート作品を探している')
    needs.push('インテリアとして飾れる芸術を求めている')
  }
  if (brand.activities?.includes('ワークショップ') || brand.activities?.includes('WS')) {
    needs.push('体験を通じた学び・達成感を求めている')
  }
  return needs.slice(0, 5)
}

function extractArtworkNeeds(artwork: Artwork): string[] {
  const needs = ['世界に一つだけのアイテムを持ちたい', '自分らしさを表現したい']
  if (artwork.genre?.includes('スニーカー')) {
    needs.push('スニーカーで個性を出したい')
    needs.push('履けるアートとして日常に取り入れたい')
  } else {
    needs.push('空間に作品の世界観を取り込みたい')
    needs.push('クリエイターを応援・支援したい')
  }
  needs.push('大切な人へ特別なプレゼントを贈りたい')
  return needs.slice(0, 5)
}

function extractWorkshopNeeds(ws: Workshop): string[] {
  return [
    '新しいことに挑戦して達成感を味わいたい',
    '体験を通じた特別な思い出を作りたい',
    '自分で作ったものへの愛着・誇りを感じたい',
    `${ws.targetAudience ? ws.targetAudience + 'として体験を楽しみたい' : '気軽に参加できるアート体験をしたい'}`,
    '同じ趣味・価値観を持つ人とつながりたい',
  ].slice(0, 5)
}
