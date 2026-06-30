import type {
  Persona, Brand, Artwork, Workshop,
  LpGoal, LpSection, ContentDraft,
} from '@/types'

// ─── LP目的設定 ──────────────────────────────────────────────

export const LP_GOAL_CONFIG: Record<
  LpGoal,
  { label: string; description: string; ctaDefault: string; phaseLabel: string; phaseColor: string }
> = {
  artwork_sales: {
    label: '作品販売',
    description: '一点物作品の購入を促すLP',
    ctaDefault: 'ご購入・お問い合わせはこちら',
    phaseLabel: '販売',
    phaseColor: 'bg-amber-100 text-amber-800',
  },
  ws_booking: {
    label: 'WS予約',
    description: 'ワークショップ参加申し込みを促すLP',
    ctaDefault: '今すぐ申し込む',
    phaseLabel: '集客',
    phaseColor: 'bg-green-100 text-green-800',
  },
  inquiry: {
    label: '問い合わせ獲得',
    description: 'カスタムオーダー・相談への誘導LP',
    ctaDefault: 'まずは無料でご相談を',
    phaseLabel: '販売',
    phaseColor: 'bg-amber-100 text-amber-800',
  },
  line_register: {
    label: 'LINE登録',
    description: 'LINE公式アカウント友だち追加を促すLP',
    ctaDefault: 'LINE友だち追加はこちら',
    phaseLabel: 'リピーター',
    phaseColor: 'bg-purple-100 text-purple-800',
  },
  awareness: {
    label: '認知拡大',
    description: '作家・ブランドを知ってもらうための紹介LP',
    ctaDefault: 'フォロー・お問い合わせはこちら',
    phaseLabel: '認知',
    phaseColor: 'bg-blue-100 text-blue-800',
  },
}

// ─── セクション定義（全LP共通の構造） ──────────────────────────

export const SECTION_KEYS = [
  { key: 'hero_headline', label: 'ファーストビュー見出し', hint: '最初に目に入るキャッチコピー（20字以内が目安）' },
  { key: 'sub_copy',      label: 'サブコピー',             hint: '見出しを補足する1〜2文。「誰向けか」を明示する' },
  { key: 'reader_pain',   label: '読者の悩み',             hint: '「こんなお悩みはありませんか？」リスト形式' },
  { key: 'solution',      label: '提案する解決策',          hint: 'この商品・サービスがどう悩みを解決するか' },
  { key: 'product_appeal',label: '商品・サービスの魅力',    hint: '特徴・強み・価格・スペックを箇条書きで' },
  { key: 'trust',         label: '信頼材料',               hint: '実績・お客様の声・メディア掲載・制作数等' },
  { key: 'anxiety_relief',label: '申し込み前の不安解消',    hint: 'よくある質問（FAQ）形式で不安を先回り解消' },
  { key: 'action_prompt', label: '行動を促す一文',          hint: 'CTAボタン直前に置く、背中を押す一言' },
  { key: 'cta_text',      label: 'CTA文言・導線',           hint: 'ボタンテキスト＋申し込み・購入先URL' },
] as const

// ─── メイン生成関数 ─────────────────────────────────────────

export function generateLpSections(input: {
  goal: LpGoal
  persona: Persona
  source: Brand | Artwork | Workshop | null
  referencedContent: ContentDraft | null
}): { sections: LpSection[]; lineCtaText: string } {
  const { goal, persona, source, referencedContent } = input

  const pain1 = persona.pains[0] || '（悩みを登録してください）'
  const pain2 = persona.pains[1] || ''
  const pain3 = persona.pains[2] || ''
  const desire1 = persona.desires[0] || '（欲しい未来を登録してください）'
  const phrase1 = persona.resonantPhrases[0] || ''
  const salesChannel = persona.salesChannelFit || '（販売導線を登録してください）'
  const purchaseAnxiety = persona.purchaseAnxiety || '（購入前の不安を登録してください）'

  // referencedContentがあれば優先してフレーズ等を取得
  const refStrength = referencedContent?.strength || ''
  const refCta = referencedContent?.cta || ''

  let contents: Record<string, string>

  switch (goal) {
    case 'artwork_sales':
      contents = genArtworkSales({ persona, source, pain1, pain2, pain3, desire1, phrase1, salesChannel, purchaseAnxiety, refStrength, refCta })
      break
    case 'ws_booking':
      contents = genWsBooking({ persona, source, pain1, pain2, pain3, desire1, phrase1, salesChannel, purchaseAnxiety, refStrength, refCta })
      break
    case 'inquiry':
      contents = genInquiry({ persona, source, pain1, pain2, desire1, phrase1, salesChannel, refStrength })
      break
    case 'line_register':
      contents = genLineRegister({ persona, source, desire1, phrase1, salesChannel })
      break
    case 'awareness':
      contents = genAwareness({ persona, source, pain1, desire1, phrase1, salesChannel })
      break
  }

  const sections: LpSection[] = SECTION_KEYS.map((sk) => ({
    key: sk.key,
    label: sk.label,
    hint: sk.hint,
    content: contents[sk.key] ?? '',
  }))

  const lineCtaText = `LINE公式アカウントで新作・WS情報をいち早くお届けしています。\n友だち追加すると、限定情報が届きます。`

  return { sections, lineCtaText }
}

// ─── 目的別生成 ─────────────────────────────────────────────

type GenParams = {
  persona: Persona
  source: Brand | Artwork | Workshop | null
  pain1: string; pain2: string; pain3?: string
  desire1: string
  phrase1: string
  salesChannel: string
  purchaseAnxiety: string
  refStrength: string
  refCta?: string
}

function genArtworkSales(p: GenParams): Record<string, string> {
  const a = p.source as Artwork | null
  const title = a?.title || '（作品名）'
  const genre = a?.genre || 'アート作品'
  const concept = a?.concept || '（コンセプトを登録してください）'
  const features = a?.features || '（特徴を登録してください）'
  const price = a?.price ? `¥${a.price.toLocaleString()}（税込）` : '（価格をお問い合わせください）'
  const targetCustomer = a?.targetCustomer || p.persona.name

  const headline = p.phrase1 || `「${title}」— 世界に一つだけの${genre}で、あなたの空間を特別に`

  return {
    hero_headline: headline,
    sub_copy: `${targetCustomer}の方へ。\n${concept}\nこの作品が、あなたの「${p.desire1}」を叶えます。`,
    reader_pain: [
      'こんなお悩みはありませんか？',
      '',
      p.pain1 ? `• ${p.pain1}` : '',
      p.pain2 ? `• ${p.pain2}` : '',
      p.pain3 ? `• ${p.pain3}` : '',
      '',
      'もし一つでも当てはまるなら、ぜひ最後まで読んでください。',
    ].filter((l) => l !== undefined).join('\n'),
    solution: [
      `「${title}」は、`,
      concept,
      '',
      p.refStrength || features,
      '',
      `${p.desire1}を求めている方に、最もおすすめしたい一点物の${genre}です。`,
    ].join('\n'),
    product_appeal: [
      `▼ 「${title}」の特徴`,
      features ? `• ${features}` : '• （特徴を記入してください）',
      `• ジャンル：${genre}`,
      `• 価格：${price}`,
      `• 一点物のため、同じものは二度と制作しません`,
      '',
      '▼ こんな方に特におすすめ',
      targetCustomer,
    ].join('\n'),
    trust: [
      '▼ お客様の声',
      '（購入者の感想・レビューを記入してください）',
      '',
      '▼ 制作実績・展示歴',
      '（展示会・メディア掲載・受賞歴等を記入してください）',
    ].join('\n'),
    anxiety_relief: [
      'よくあるご質問',
      '',
      `Q：${p.purchaseAnxiety.split('\n')[0] || '本当に自分に合うか不安です'}`,
      'A：（回答を記入してください）',
      '',
      'Q：実物を見ずに購入して失敗しませんか？',
      'A：詳細な写真・動画をお送りします。ご不明点はDM・メールでお気軽にご質問ください。',
      '',
      'Q：納品・発送はどうなりますか？',
      'A：（納品方法・期間を記入してください）',
    ].join('\n'),
    action_prompt: `「${p.desire1}」を、今すぐ叶えてみませんか？\n一点物のため、ご購入はお早めに。`,
    cta_text: `【 ${p.refCta || 'ご購入・お問い合わせはこちら'} 】\n${p.salesChannel}`,
  }
}

function genWsBooking(p: GenParams): Record<string, string> {
  const w = p.source as Workshop | null
  const title = w?.title || '（WS名）'
  const description = w?.description || '（WSの内容を登録してください）'
  const targetAudience = w?.targetAudience || p.persona.name
  const format = w
    ? (w.format === 'in-person' ? '対面（会場）' : w.format === 'online' ? 'オンライン' : '出張')
    : '（形式）'
  const price = w ? `¥${w.price.toLocaleString()}/人` : '（参加費）'
  const duration = w?.duration || '（所要時間）'

  const headline = p.phrase1 || `「${title}」— ${p.desire1}を体験で叶える`

  return {
    hero_headline: headline,
    sub_copy: `${targetAudience}の方へ。\n「${title}」は、${description.slice(0, 60)}という特別な体験です。\nこのワークショップが、あなたの「${p.desire1}」を実現します。`,
    reader_pain: [
      'こんな方におすすめです',
      '',
      p.pain1 ? `• ${p.pain1}` : '',
      p.pain2 ? `• ${p.pain2}` : '',
      p.pain3 ? `• ${p.pain3}` : '',
      '',
      '一つでも当てはまる方は、ぜひこのWSに参加してみてください。',
    ].filter((l) => l !== undefined).join('\n'),
    solution: [
      `「${title}」では、`,
      description,
      '',
      `${p.desire1}を体験を通じて実現できます。`,
      '',
      p.refStrength || '（WSの特徴・他との違いを補足してください）',
    ].join('\n'),
    product_appeal: [
      '▼ WS開催詳細',
      `• 開催形式：${format}`,
      `• 参加費：${price}`,
      `• 所要時間：${duration}`,
      w?.capacity ? `• 定員：${w.capacity}名（先着順）` : '',
      w?.location ? `• 場所：${w.location}` : '',
      '',
      '▼ このWSで得られること',
      `• ${p.desire1}を体験できる`,
      '• 参加後に使える・飾れる作品が完成する',
      '• 同じ趣味を持つ方とつながれる',
    ].filter(Boolean).join('\n'),
    trust: [
      '▼ 参加者の声',
      '（参加者からの感想・レビューを記入してください）',
      '',
      '▼ 過去の開催実績',
      '（これまでの開催数・参加者数を記入してください）',
    ].join('\n'),
    anxiety_relief: [
      'よくあるご質問',
      '',
      `Q：${p.purchaseAnxiety.split('\n')[0] || '初心者でも参加できますか？'}`,
      'A：初めての方でも丁寧にサポートします。特別な道具・経験は不要です。',
      '',
      'Q：キャンセルはできますか？',
      'A：（キャンセルポリシーを記入してください）',
      '',
      'Q：持ち物はありますか？',
      'A：（必要な持ち物を記入してください）',
    ].join('\n'),
    action_prompt: `残席わずかです。「${p.desire1}」を体験したい方は、今すぐお申し込みください。`,
    cta_text: `【 ${p.refCta || '今すぐ申し込む'} 】\n${p.salesChannel}`,
  }
}

function genInquiry(p: Omit<GenParams, 'pain3' | 'purchaseAnxiety'>): Record<string, string> {
  const source = p.source
  let productDesc = 'アート作品・ワークショップ'
  let features = ''
  if (source && p.persona.sourceType === 'artwork') {
    const a = source as Artwork
    productDesc = `${a.genre || 'アート作品'}のカスタム・オーダー`
    features = a.features || ''
  } else if (source && p.persona.sourceType === 'workshop') {
    const w = source as Workshop
    productDesc = `「${w.title}」への参加・出張WS依頼`
    features = w.description || ''
  } else if (source) {
    const b = source as Brand
    productDesc = b.products || b.activities || 'アート・WS'
    features = b.strengths || ''
  }

  return {
    hero_headline: p.phrase1 || `まずはお気軽にご相談ください`,
    sub_copy: `${productDesc}について、価格・納期・内容など、\nどんな小さなことでもお気軽にお問い合わせいただけます。`,
    reader_pain: [
      'こんなことでお悩みではありませんか？',
      '',
      p.pain1 ? `• ${p.pain1}` : '',
      p.pain2 ? `• ${p.pain2}` : '',
      '• 何から相談すればよいかわからない',
      '',
      'そのまま一人で悩まずに、まずはご連絡ください。',
    ].filter((l) => l !== undefined).join('\n'),
    solution: [
      `${productDesc}について、一から丁寧にご相談をお受けしています。`,
      '',
      features || '（提供できるサービスの概要を記入してください）',
      '',
      `「${p.desire1}」を叶えるために、一緒に考えさせてください。`,
    ].join('\n'),
    product_appeal: [
      '▼ 対応可能な内容',
      p.refStrength || features || '（対応できる内容・得意分野を記入してください）',
      '',
      '▼ ご相談の流れ',
      '① お問い合わせフォーム or DMでご連絡',
      '② 内容確認後、1〜2営業日以内にご返信',
      '③ ご要望をヒアリング・お見積もり',
      '④ 制作・実施へ',
    ].join('\n'),
    trust: [
      '▼ 実績',
      '（これまでの制作・対応実績を記入してください）',
      '',
      '▼ お客様の声',
      '（依頼者の感想・レビューを記入してください）',
    ].join('\n'),
    anxiety_relief: [
      'よくあるご質問',
      '',
      'Q：予算が少ないのですが相談できますか？',
      'A：まずはご要望をお聞きした上で、可能な範囲でご提案します。',
      '',
      'Q：遠方でも対応していただけますか？',
      'A：（対応エリアを記入してください）',
      '',
      'Q：相談は無料ですか？',
      'A：（無料相談の有無を記入してください）',
    ].join('\n'),
    action_prompt: `まずはお気軽にお問い合わせください。\n「${p.desire1}」に向けた第一歩を一緒に踏み出しましょう。`,
    cta_text: `【 ${p.refCta || 'お問い合わせはこちら'} 】\n${p.salesChannel}`,
  }
}

function genLineRegister(p: Pick<GenParams, 'persona' | 'source' | 'desire1' | 'phrase1' | 'salesChannel'>): Record<string, string> {
  let brandName = '（ブランド名）'
  let activities = 'アート・ワークショップ'
  if (p.source && p.persona.sourceType === 'brand') {
    const b = p.source as Brand
    brandName = b.name
    activities = b.activities || b.products || activities
  } else if (p.source && p.persona.sourceType === 'artwork') {
    const a = p.source as Artwork
    brandName = a.title
    activities = `${a.genre}の作品・制作活動`
  } else if (p.source && p.persona.sourceType === 'workshop') {
    const w = p.source as Workshop
    brandName = w.title
    activities = 'ワークショップ・アート体験'
  }

  return {
    hero_headline: p.phrase1 || `${brandName}のLINE公式、友だち追加で先行情報をゲット`,
    sub_copy: `新作・WS情報・限定オファーをLINEで直接お届けします。\nSNSで見逃さないために、ぜひ友だち追加してください。`,
    reader_pain: [
      'こんなことはありませんか？',
      '',
      '• 新作が気になっても、SNSを見忘れてしまう',
      '• WSに申し込もうとしたら、すでに満員だった',
      '• 限定情報を見逃してしまった',
      '',
      'LINEに登録すれば、もうそんな心配はありません。',
    ].join('\n'),
    solution: [
      `${brandName}のLINE公式アカウントでは、`,
      `${activities}に関する最新情報をLINEで直接お届けしています。`,
      '',
      `「${p.desire1}」を叶えたい方に、特に有益な情報をお送りします。`,
    ].join('\n'),
    product_appeal: [
      '▼ LINE登録の特典・メリット',
      '• 新作・WS情報をいち早くお届け',
      '• LINE限定のお得な情報・先行予約権',
      '• 質問や相談もLINEで気軽にできる',
      '',
      '▼ 配信頻度',
      '（配信頻度の目安を記入してください）',
    ].join('\n'),
    trust: [
      '▼ 現在の登録者数',
      '（友だち数・登録者数を記入してください）',
      '',
      '▼ 登録者の声',
      '（登録してよかったという声を記入してください）',
    ].join('\n'),
    anxiety_relief: [
      'よくある疑問',
      '',
      'Q：スパムメッセージは来ませんか？',
      'A：月に数回の有益な情報のみをお送りします。不要になればいつでもブロック・解除できます。',
      '',
      'Q：個人情報は必要ですか？',
      'A：友だち追加だけで使えます。名前や連絡先の入力は不要です。',
      '',
      'Q：費用はかかりますか？',
      'A：完全無料です。',
    ].join('\n'),
    action_prompt: `今すぐ友だち追加して、「${p.desire1}」に役立つ情報を受け取りましょう。`,
    cta_text: `【 LINE友だち追加はこちら 】\n${p.salesChannel}`,
  }
}

function genAwareness(p: Pick<GenParams, 'persona' | 'source' | 'pain1' | 'desire1' | 'phrase1' | 'salesChannel'>): Record<string, string> {
  let brandName = '（ブランド名）'
  let concept = ''
  let activities = ''
  let strengths = ''
  if (p.source && p.persona.sourceType === 'brand') {
    const b = p.source as Brand
    brandName = b.name
    activities = b.activities || ''
    strengths = b.strengths || ''
    concept = b.products || ''
  } else if (p.source && p.persona.sourceType === 'artwork') {
    const a = p.source as Artwork
    brandName = a.title
    concept = a.concept || ''
    strengths = a.features || ''
    activities = a.genre || ''
  } else if (p.source && p.persona.sourceType === 'workshop') {
    const w = p.source as Workshop
    brandName = w.title
    concept = w.description || ''
    activities = 'ワークショップ・アート体験'
  }

  return {
    hero_headline: p.phrase1 || `${brandName}について`,
    sub_copy: `${activities || 'アート・ワークショップ'}を通じて、\n「${p.desire1}」を届けています。`,
    reader_pain: [
      `${p.pain1 ? '「' + p.pain1 + '」' : ''}を感じているあなたへ。`,
      '',
      '私もかつて、同じような悩みを抱えていました。',
      'だからこそ、${brandName}が生まれました。',
      '',
      '（作家・ブランドのストーリーを記入してください）',
    ].join('\n'),
    solution: [
      `${brandName}は、${activities || 'アート・ワークショップ'}を通じて、`,
      concept || '（提供している価値・コンセプトを記入してください）',
      '',
      `「${p.desire1}」を実現するお手伝いをしています。`,
    ].join('\n'),
    product_appeal: [
      '▼ 活動内容',
      activities || '（活動内容を記入してください）',
      '',
      '▼ 強み・こだわり',
      strengths || '（強み・こだわりを記入してください）',
      '',
      '▼ 作品・WSを見る',
      '（代表作品・人気WSを紹介してください）',
    ].join('\n'),
    trust: [
      '▼ 制作実績・展示歴',
      '（展示会・メディア掲載・受賞歴を記入してください）',
      '',
      '▼ お客様の声',
      '（作品購入者・WS参加者の声を記入してください）',
    ].join('\n'),
    anxiety_relief: [
      '初めての方へ',
      '',
      'Q：どんな作品を作っているの？',
      'A：（代表作品・ジャンルを記入してください）',
      '',
      'Q：購入やWSの申し込み方は？',
      `A：${p.salesChannel}からお問い合わせください。`,
      '',
      'Q：作品の価格帯は？',
      'A：（価格帯を記入してください）',
    ].join('\n'),
    action_prompt: `まずはSNSをフォローして、最新の作品・WSをチェックしてみてください。`,
    cta_text: `【 ${p.phrase1 ? p.phrase1.slice(0, 20) : 'フォロー・お問い合わせはこちら'} 】\n${p.salesChannel}`,
  }
}
