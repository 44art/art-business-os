import type {
  Persona, Brand, Artwork, Workshop,
  ContentType, ContentDraft, MarketingPhaseLink,
} from '@/types'

// ─── 定数マッピング ─────────────────────────────────────────

export const CONTENT_TYPE_CONFIG: Record<
  ContentType,
  { label: string; description: string; phase: MarketingPhaseLink; phaseLabel: string; phaseColor: string }
> = {
  sns_post: {
    label: 'SNS投稿文',
    description: 'Instagram・X向けのフック＋本文＋ハッシュタグ',
    phase: 'awareness',
    phaseLabel: '認知',
    phaseColor: 'bg-blue-100 text-blue-800',
  },
  ws_announce: {
    label: 'WS告知文',
    description: 'ワークショップ募集の告知テキスト一式',
    phase: 'acquisition',
    phaseLabel: '集客',
    phaseColor: 'bg-green-100 text-green-800',
  },
  artwork_sales: {
    label: '作品販売文',
    description: '作品の世界観・強みを伝える販売テキスト',
    phase: 'sales',
    phaseLabel: '販売',
    phaseColor: 'bg-amber-100 text-amber-800',
  },
  line_message: {
    label: 'LINE配信文',
    description: '友だちへのお知らせ・告知メッセージ',
    phase: 'retention',
    phaseLabel: 'リピーター',
    phaseColor: 'bg-purple-100 text-purple-800',
  },
  lp_intro: {
    label: 'LP導入文',
    description: 'LPの見出し・サブ見出し・ボディコピー構成案',
    phase: 'sales',
    phaseLabel: '販売',
    phaseColor: 'bg-amber-100 text-amber-800',
  },
}

// ─── メイン生成関数 ─────────────────────────────────────────

export type GenerationInput = {
  contentType: ContentType
  persona: Persona
  source: Brand | Artwork | Workshop | null
}

export type GenerationOutput = Omit<
  ContentDraft,
  'id' | 'personaId' | 'personaName' | 'sourceType' | 'sourceId' | 'sourceName' | 'status' | 'generatedAt' | 'updatedAt'
>

export function generateContentDraft(input: GenerationInput): GenerationOutput {
  const { contentType, persona, source } = input
  const cfg = CONTENT_TYPE_CONFIG[contentType]

  const pain = persona.pains[0] || ''
  const desire = persona.desires[0] || ''
  const phrase = persona.resonantPhrases[0] || ''
  const channel = persona.salesChannelFit || 'プロフィールリンク'

  switch (contentType) {
    case 'sns_post':     return genSnsPost(persona, source, cfg, pain, desire, phrase, channel)
    case 'ws_announce':  return genWsAnnounce(persona, source, cfg, pain, desire, channel)
    case 'artwork_sales':return genArtworkSales(persona, source, cfg, pain, desire, phrase, channel)
    case 'line_message': return genLineMessage(persona, source, cfg, channel)
    case 'lp_intro':     return genLpIntro(persona, source, cfg, pain, desire, phrase, channel)
  }
}

// ─── SNS投稿 ────────────────────────────────────────────────

function genSnsPost(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  cfg: (typeof CONTENT_TYPE_CONFIG)[ContentType],
  pain: string, desire: string, phrase: string, channel: string
): GenerationOutput {
  const { subject, bodyLines, strength } = extractSourceInfo(persona, source)
  const hashtags = buildHashtags(persona, source)

  const parts: string[] = []

  if (pain) {
    parts.push(`「${pain}」\n\nそんなお気持ち、ありませんか？`)
    parts.push('')
  }

  parts.push(subject ? `${subject}は、` : '')
  if (bodyLines[0]) parts.push(bodyLines[0])
  if (bodyLines[1]) parts.push(bodyLines[1])

  if (phrase) {
    parts.push('')
    parts.push(`—— ${phrase} ——`)
  }

  if (desire) {
    parts.push('')
    parts.push(`${desire}を実現したい方に、ぜひ一度見ていただきたいです。`)
  }

  parts.push('')
  parts.push('詳細・お問い合わせはプロフィールリンクから↓')
  parts.push(channel)

  return {
    contentType: 'sns_post',
    phaseLink: cfg.phase,
    targetPerson: persona.name,
    addressedPain: pain || '（未設定）',
    addressedDesire: desire || '（未設定）',
    strength,
    cta: `詳細はプロフィールリンクへ → ${channel}`,
    salesChannel: channel,
    content: parts.filter(Boolean).join('\n'),
    hashtags,
  }
}

// ─── WS告知文 ───────────────────────────────────────────────

function genWsAnnounce(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  cfg: (typeof CONTENT_TYPE_CONFIG)[ContentType],
  pain: string, desire: string, channel: string
): GenerationOutput {
  let title = '（WS名）'
  let description = ''
  let targetAudience = persona.name
  let formatLabel = '対面'
  let price = ''
  let duration = ''
  let strength = ''

  if (persona.sourceType === 'workshop' && source) {
    const w = source as Workshop
    title = w.title
    description = w.description || ''
    targetAudience = w.targetAudience || persona.name
    formatLabel = w.format === 'in-person' ? '対面（会場）' : w.format === 'online' ? 'オンライン' : '出張'
    price = w.price > 0 ? `¥${w.price.toLocaleString()}/人` : '無料'
    duration = w.duration || ''
    strength = description.slice(0, 60)
  } else if (source) {
    const b = source as Brand
    title = b.name + 'のワークショップ'
    description = b.activities || ''
    strength = b.strengths?.slice(0, 60) || ''
  }

  const content = [
    `【${title}】開催のお知らせ`,
    '',
    description || '（WSの内容を補足してください）',
    '',
    '▼ こんな方におすすめ',
    targetAudience,
    ...(pain ? [`・「${pain}」を解決したい方`] : []),
    ...(desire ? [`・「${desire}」を目指している方`] : []),
    '',
    '▼ 開催詳細',
    `・形式：${formatLabel}`,
    ...(price ? [`・参加費：${price}`] : []),
    ...(duration ? [`・所要時間：${duration}`] : []),
    '',
    '▼ お申し込み・詳細はこちら',
    channel,
    '',
    '残席に限りがあります。気になる方はお早めにどうぞ！',
  ].join('\n')

  return {
    contentType: 'ws_announce',
    phaseLink: cfg.phase,
    targetPerson: persona.name,
    addressedPain: pain || '（未設定）',
    addressedDesire: desire || '（未設定）',
    strength: strength || '体験型ワークショップの魅力',
    cta: `お申し込みは ${channel} から`,
    salesChannel: channel,
    content,
    hashtags: buildHashtags(persona, source),
  }
}

// ─── 作品販売文 ─────────────────────────────────────────────

function genArtworkSales(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  cfg: (typeof CONTENT_TYPE_CONFIG)[ContentType],
  pain: string, desire: string, phrase: string, channel: string
): GenerationOutput {
  let title = '（作品名）'
  let concept = ''
  let features = ''
  let targetCustomer = persona.name
  let priceText = '（価格はお問い合わせください）'
  let strength = ''
  let genre = ''

  if (persona.sourceType === 'artwork' && source) {
    const a = source as Artwork
    title = a.title
    genre = a.genre || ''
    concept = a.concept || ''
    features = a.features || ''
    targetCustomer = a.targetCustomer || persona.name
    priceText = a.price ? `¥${a.price.toLocaleString()}（税込）` : 'お問い合わせください'
    strength = features || concept
  } else if (source) {
    const b = source as Brand
    title = b.name + 'の作品'
    strength = b.strengths?.slice(0, 60) || ''
  }

  const content = [
    `「${title}」`,
    ...(genre ? [`— ${genre} —`] : []),
    '',
    concept || '（作品のコンセプト・込めた想いを補足してください）',
    '',
    '▼ こんな方に',
    targetCustomer,
    ...(pain ? [`「${pain}」を感じている方`] : []),
    ...(desire ? [`「${desire}」を叶えたい方`] : []),
    '',
    ...(features ? ['▼ 作品の特徴', features, ''] : []),
    ...(phrase ? [`—— ${phrase} ——`, ''] : []),
    '▼ 価格',
    priceText,
    '',
    'ご購入・お問い合わせはこちら',
    channel,
    '',
    '一点物のため、お早めにどうぞ。',
  ].join('\n')

  return {
    contentType: 'artwork_sales',
    phaseLink: cfg.phase,
    targetPerson: persona.name,
    addressedPain: pain || '（未設定）',
    addressedDesire: desire || '（未設定）',
    strength: strength || '一点物作品の価値・世界観',
    cta: `ご購入は ${channel} から`,
    salesChannel: channel,
    content,
    hashtags: buildHashtags(persona, source),
  }
}

// ─── LINE配信文 ─────────────────────────────────────────────

function genLineMessage(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  cfg: (typeof CONTENT_TYPE_CONFIG)[ContentType],
  channel: string
): GenerationOutput {
  let senderName = '（名前）'
  let announceBody = '（告知内容を入力してください）'
  let strength = ''

  if (source) {
    if (persona.sourceType === 'brand') {
      const b = source as Brand
      senderName = b.name
      announceBody = `${b.activities || '新しい取り組み'}のお知らせです。\n${b.products || '（詳細を補足してください）'}`
      strength = b.strengths?.slice(0, 60) || ''
    } else if (persona.sourceType === 'artwork') {
      const a = source as Artwork
      senderName = '作家'
      announceBody = `新作「${a.title}」を公開しました！\n${a.concept || ''}\n\n${a.price ? '価格：¥' + a.price.toLocaleString() : ''}`
      strength = a.features || a.concept || ''
    } else {
      const w = source as Workshop
      senderName = '主催者'
      announceBody = `「${w.title}」の開催をお知らせします！\n${w.description?.slice(0, 80) || ''}\n\n参加費：¥${w.price.toLocaleString()}/人`
      strength = w.description?.slice(0, 60) || ''
    }
  }

  const desire = persona.desires[0] || ''

  const content = [
    `こんにちは、${senderName}です！`,
    '',
    `いつもご覧いただきありがとうございます。`,
    '',
    announceBody,
    '',
    ...(desire ? [`${desire}を目指している方に特におすすめです。`,''] : []),
    '▼ 詳細はこちら',
    channel,
    '',
    '気になる方は、このトークにそのまま返信してください。',
    'お気軽にどうぞ！',
  ].join('\n')

  return {
    contentType: 'line_message',
    phaseLink: cfg.phase,
    targetPerson: persona.name,
    addressedPain: persona.pains[0] || '（未設定）',
    addressedDesire: desire || '（未設定）',
    strength: strength || '既存顧客へのパーソナルな告知',
    cta: `詳細・お問い合わせ → ${channel}`,
    salesChannel: channel,
    content,
    hashtags: [],
  }
}

// ─── LP導入文 ───────────────────────────────────────────────

function genLpIntro(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  cfg: (typeof CONTENT_TYPE_CONFIG)[ContentType],
  pain: string, desire: string, phrase: string, channel: string
): GenerationOutput {
  const { subject, bodyLines, strength } = extractSourceInfo(persona, source)
  const headline = phrase || desire || `あなただけの${subject || 'アート体験'}`
  const subheadline = desire || '特別な一点物で、日常をもっと自分らしく。'

  const content = [
    '── 大見出し ──────────────────',
    headline,
    '',
    '── サブ見出し ─────────────────',
    subheadline,
    '',
    '── 問題提起（本文前半）────────',
    pain
      ? `「${pain}」\n\nそんな悩みを抱えていませんか？`
      : '（ペルソナの悩みをもとに問題提起を補足してください）',
    '',
    '── 解決策・強み（本文後半）────',
    subject ? `${subject}は、` : '',
    bodyLines[0] || '（素材情報をもとに補足してください）',
    ...(bodyLines[1] ? [bodyLines[1]] : []),
    '',
    `${persona.name || '理想の顧客'}の方が「これだ」と感じてくれるものを目指しました。`,
    '',
    '── CTA ────────────────────────',
    `【 ${desire ? desire + 'を叶える' : 'まずはお問い合わせから'} 】`,
    `↓`,
    channel,
  ].filter(s => s !== undefined).join('\n')

  return {
    contentType: 'lp_intro',
    phaseLink: cfg.phase,
    targetPerson: persona.name,
    addressedPain: pain || '（未設定）',
    addressedDesire: desire || '（未設定）',
    strength: strength || subject || '作品・WSの世界観',
    cta: `${desire ? desire + 'を叶える' : '詳細を見る'} → ${channel}`,
    salesChannel: channel,
    content,
    hashtags: [],
  }
}

// ─── ヘルパー ────────────────────────────────────────────────

function extractSourceInfo(
  persona: Persona,
  source: Brand | Artwork | Workshop | null
): { subject: string; bodyLines: string[]; strength: string } {
  if (!source) return { subject: '', bodyLines: [], strength: '' }

  if (persona.sourceType === 'artwork') {
    const a = source as Artwork
    return {
      subject: `「${a.title}」（${a.genre || 'アート作品'}）`,
      bodyLines: [
        a.concept || '',
        a.features || '',
        a.price ? `価格：¥${a.price.toLocaleString()}` : '',
      ].filter(Boolean),
      strength: a.features || a.concept || '',
    }
  }

  if (persona.sourceType === 'workshop') {
    const w = source as Workshop
    return {
      subject: `「${w.title}」ワークショップ`,
      bodyLines: [
        w.description?.slice(0, 80) || '',
        `参加費：¥${w.price.toLocaleString()}/人 / 所要時間：${w.duration || '未設定'}`,
      ].filter(Boolean),
      strength: w.description?.slice(0, 60) || '',
    }
  }

  const b = source as Brand
  return {
    subject: b.name,
    bodyLines: [b.activities || '', b.strengths?.slice(0, 80) || ''].filter(Boolean),
    strength: b.strengths?.slice(0, 60) || b.activities || '',
  }
}

function buildHashtags(persona: Persona, source: Brand | Artwork | Workshop | null): string[] {
  const tags: string[] = []

  if (persona.sourceType === 'artwork' && source) {
    const a = source as Artwork
    if (a.genre?.includes('スニーカー')) tags.push('スニーカーペイント', 'カスタムスニーカー', 'スニーカーカスタム')
    else if (a.genre?.includes('箔')) tags.push('箔画', '日本画', '和のアート')
    else if (a.genre?.includes('抽象')) tags.push('抽象画', 'アブストラクトアート')
    tags.push('一点物', 'アート', 'handmade', 'アーティスト')
  } else if (persona.sourceType === 'workshop' && source) {
    const w = source as Workshop
    tags.push('ワークショップ', 'ws', '体験', '手作り', '習い事')
    if (w.format === 'online') tags.push('オンラインws', 'オンライン講座')
    if (w.format === 'in-person') tags.push('対面ws', '東京ws')
  } else {
    tags.push('アーティスト', 'アート', 'handmade', '作家')
  }

  // チャネルに応じてInstagramタグを調整
  if (persona.usedChannels.includes('Instagram')) {
    tags.push('instagramjapan', 'japanart')
  }

  return tags.slice(0, 8).map((t) => `#${t}`)
}
