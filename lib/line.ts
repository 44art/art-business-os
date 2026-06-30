import type {
  Persona, Brand, Artwork, Workshop,
  LineGoal, LineSection, ContentDraft, LandingPageDraft,
} from '@/types'

// ─── LINE目的設定 ─────────────────────────────────────────

export const LINE_GOAL_CONFIG: Record<
  LineGoal,
  { label: string; description: string; phaseLabel: string; phaseColor: string }
> = {
  ws_booking: {
    label: 'ワークショップ予約',
    description: 'WS先行情報・申し込みにつなげる',
    phaseLabel: '集客',
    phaseColor: 'bg-green-100 text-green-800',
  },
  artwork_sales: {
    label: '作品販売',
    description: '新作情報・購入へのナーチャリング',
    phaseLabel: '販売',
    phaseColor: 'bg-amber-100 text-amber-800',
  },
  inquiry: {
    label: '問い合わせ獲得',
    description: 'カスタム相談・オーダーへの導線',
    phaseLabel: '販売',
    phaseColor: 'bg-amber-100 text-amber-800',
  },
  repeat: {
    label: 'リピーター化',
    description: '購入・参加後のフォローアップと再購買',
    phaseLabel: 'リピーター',
    phaseColor: 'bg-purple-100 text-purple-800',
  },
  fan: {
    label: 'ファン化',
    description: '制作裏話・限定情報でコアファンを育てる',
    phaseLabel: 'リピーター',
    phaseColor: 'bg-purple-100 text-purple-800',
  },
}

// ─── セクション定義（全LINE案共通の構造）────────────────────

export const LINE_SECTION_KEYS = [
  {
    key: 'line_register_copy',
    label: 'LINE登録を促す文言',
    hint: 'SNS・LPで使う「LINEに登録してください」の訴求文',
  },
  {
    key: 'register_benefit',
    label: '登録特典の案',
    hint: '友だち追加の理由になる特典・メリットのリスト',
  },
  {
    key: 'greeting_message',
    label: '初回あいさつ文',
    hint: '友だち追加直後に自動送信するウェルカムメッセージ',
  },
  {
    key: 'message_1',
    label: '1通目の配信文',
    hint: '自己紹介・何者か・何を届けるかを伝える（登録翌日〜3日後）',
  },
  {
    key: 'message_2',
    label: '2通目の配信文',
    hint: '価値提供・体験談・実績を伝える（1通目から3〜5日後）',
  },
  {
    key: 'message_3',
    label: '3通目の配信文',
    hint: '具体的な提案・行動喚起（2通目から3〜5日後）',
  },
  {
    key: 'sales_cta',
    label: 'CTA文・販売/予約/問い合わせへの誘導',
    hint: '購入・申し込み・相談への最終的な背中を押す一文＋導線',
  },
  {
    key: 'delivery_notes',
    label: '配信時の注意点',
    hint: '開封率・ブロック対策・配信頻度・送信時間帯のガイドライン',
  },
] as const

// ─── メイン生成関数 ─────────────────────────────────────────

export type LineGenerationInput = {
  goal: LineGoal
  persona: Persona
  source: Brand | Artwork | Workshop | null
  referencedContent: ContentDraft | null
  referencedLp: LandingPageDraft | null
}

export function generateLineSections(input: LineGenerationInput): {
  sections: LineSection[]
  recommendedChannels: string[]
  snsCtaText: string
} {
  const { goal, persona, source, referencedContent, referencedLp } = input

  const pain1 = persona.pains[0] || ''
  const desire1 = persona.desires[0] || ''
  const phrase1 = persona.resonantPhrases[0] || ''
  const salesChannel = persona.salesChannelFit || '（販売導線を登録してください）'
  // LP案のLINE誘導文を優先利用
  const lineCtaFromLp = referencedLp?.lineCtaText || ''
  const lineUrl = referencedLp?.lineRegistrationUrl || '（LINE登録URLを入力してください）'

  let contentMap: Record<string, string>

  switch (goal) {
    case 'ws_booking':    contentMap = genWsBooking(persona, source, pain1, desire1, phrase1, salesChannel, lineUrl, lineCtaFromLp); break
    case 'artwork_sales': contentMap = genArtworkSales(persona, source, pain1, desire1, phrase1, salesChannel, lineUrl, lineCtaFromLp); break
    case 'inquiry':       contentMap = genInquiry(persona, source, pain1, desire1, salesChannel, lineUrl); break
    case 'repeat':        contentMap = genRepeat(persona, source, desire1, salesChannel, lineUrl); break
    case 'fan':           contentMap = genFan(persona, source, desire1, phrase1, salesChannel, lineUrl); break
  }

  const sections: LineSection[] = LINE_SECTION_KEYS.map((sk) => ({
    key: sk.key,
    label: sk.label,
    hint: sk.hint,
    content: contentMap[sk.key] ?? '',
  }))

  const recommendedChannels = persona.usedChannels.length > 0
    ? persona.usedChannels
    : ['Instagram', 'X']

  const snsCtaText = phrase1
    ? `${phrase1}\n▼ 先行情報・限定情報はLINEで配信中\n${lineUrl}`
    : `新作・WS情報を先行配信中！\nLINE登録でいち早くお届けします↓\n${lineUrl}`

  return { sections, recommendedChannels, snsCtaText }
}

// ─── 目的別生成 ─────────────────────────────────────────────

function genWsBooking(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  pain1: string,
  desire1: string,
  phrase1: string,
  salesChannel: string,
  lineUrl: string,
  lineCtaFromLp: string,
): Record<string, string> {
  const w = source as Workshop | null
  const title = w?.title || '（WS名）'
  const description = w?.description ? w.description.slice(0, 60) : '（WSの内容）'
  const price = w ? `¥${w.price.toLocaleString()}/人` : '（参加費）'
  const format = w
    ? (w.format === 'in-person' ? '対面' : w.format === 'online' ? 'オンライン' : '出張')
    : '（形式）'
  const targetAudience = w?.targetAudience || persona.name
  const senderName = '（名前・屋号）'

  return {
    line_register_copy: lineCtaFromLp || [
      `「${title}」の先行募集情報をLINEでお届けします。`,
      `公式サイトより早く情報が届くので、満員になる前に申し込みできます。`,
      `▼ 友だち追加はこちら`,
      lineUrl,
    ].join('\n'),

    register_benefit: [
      '▼ LINE登録の特典',
      `・「${title}」次回開催の先行予約権`,
      '・満員前の先着優先案内',
      '・WS参加者限定の割引情報',
      '・開催前日リマインド配信',
      '',
      '（特典内容を実際に提供できるものに編集してください）',
    ].join('\n'),

    greeting_message: [
      `友だち追加ありがとうございます！`,
      `${senderName}です😊`,
      '',
      `「${title}」に興味を持っていただき、とても嬉しいです。`,
      '',
      `このアカウントでは、`,
      `・WSの先行募集情報`,
      `・開催レポート・参加者の声`,
      `・限定割引情報`,
      `をお届けします。`,
      '',
      `気になることがあれば、`,
      `いつでもこのトークに返信してください👇`,
    ].join('\n'),

    message_1: [
      `改めて、自己紹介させてください。`,
      '',
      `私は${senderName}です。`,
      `${description}を提供しています。`,
      '',
      `このWSは、「${desire1 || targetAudience}」を実現したい方のために作りました。`,
      '',
      `${pain1 ? `「${pain1}」という悩みを抱えている方に、` : ''}`,
      `ぜひ体験してもらいたいと思っています。`,
      '',
      `次回の開催情報が決まり次第、こちらでお知らせしますね！`,
    ].filter(Boolean).join('\n'),

    message_2: [
      `参加者の方からこんな声をいただきました👇`,
      '',
      `「（参加者の声・感想を記入してください）」`,
      '',
      `「${title}」では、${description}という体験を提供しています。`,
      '',
      `・形式：${format}`,
      `・参加費：${price}`,
      '',
      `初めての方も、スタッフが丁寧にサポートするのでご安心ください😊`,
    ].join('\n'),

    message_3: [
      `お待たせしました！次回の開催が決まりました🎉`,
      '',
      `「${title}」`,
      `・形式：${format}`,
      `・参加費：${price}`,
      `・日程：（日程を記入してください）`,
      `・場所：（場所・URLを記入してください）`,
      '',
      `LINE登録者限定で、先行予約を受け付けます。`,
      `お申し込みはこちら↓`,
      salesChannel,
      '',
      `ご質問があれば返信ください！`,
    ].join('\n'),

    sales_cta: [
      `【 今すぐ申し込む 】`,
      salesChannel,
      '',
      `残席わずかです。気になった方はお早めに😊`,
      `ご不明点はこのトークに返信ください。`,
    ].join('\n'),

    delivery_notes: buildDeliveryNotes(),
  }
}

function genArtworkSales(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  pain1: string,
  desire1: string,
  phrase1: string,
  salesChannel: string,
  lineUrl: string,
  lineCtaFromLp: string,
): Record<string, string> {
  const a = source as Artwork | null
  const title = a?.title || '（作品名）'
  const genre = a?.genre || 'アート作品'
  const concept = a?.concept ? a.concept.slice(0, 60) : '（コンセプト）'
  const features = a?.features ? a.features.slice(0, 60) : '（特徴）'
  const price = a?.price ? `¥${a.price.toLocaleString()}` : '（価格）'
  const senderName = '（名前・屋号）'

  return {
    line_register_copy: lineCtaFromLp || [
      `「${title}」の新作情報・先行販売をLINEでいち早くお届けします。`,
      `SNSで公開する前に、LINE登録者だけに先行公開しています。`,
      `▼ 友だち追加はこちら`,
      lineUrl,
    ].join('\n'),

    register_benefit: [
      '▼ LINE登録の特典',
      `・新作の先行公開（SNS公開より先に見られる）`,
      `・LINE登録者限定の購入優先権`,
      `・制作裏話・こだわりの秘話`,
      `・限定割引・キャンペーン情報`,
      '',
      '（提供できる特典に編集してください）',
    ].join('\n'),

    greeting_message: [
      `友だち追加ありがとうございます！`,
      `${senderName}です😊`,
      '',
      `このアカウントでは、`,
      `・${genre}の新作情報`,
      `・制作過程の裏話`,
      `・LINE限定の先行販売・特別価格情報`,
      `をお届けします。`,
      '',
      `${desire1 ? `「${desire1}」を叶えたい方に、` : ''}ぴったりの作品をお届けできたら嬉しいです。`,
      '',
      `質問・ご相談はいつでも返信ください👇`,
    ].join('\n'),

    message_1: [
      `改めて自己紹介させてください。`,
      '',
      `私は${senderName}、${genre}の作家です。`,
      '',
      phrase1 ? `「${phrase1}」` : `「${desire1 || '世界に一つだけの作品を'}」`,
      `をコンセプトに制作しています。`,
      '',
      `${pain1 ? `「${pain1}」という悩みを持つ方へ、` : ''}`,
      `私の作品が日常に特別な彩りを添えられたら嬉しいです。`,
      '',
      `今後、新作や制作日記をお届けしていきます。楽しみにしていてください！`,
    ].filter(Boolean).join('\n'),

    message_2: [
      `今日は、「${title}」についてお伝えします。`,
      '',
      concept,
      '',
      `▼ こだわりのポイント`,
      features,
      '',
      `${desire1 ? `「${desire1}」を大切にする方にぜひ` : ''}見ていただきたい作品です。`,
      '',
      `ご興味があれば、返信または下記からご連絡ください。`,
      salesChannel,
    ].join('\n'),

    message_3: [
      `「${title}」の販売について、詳しくお伝えします。`,
      '',
      `▼ 作品の詳細`,
      `・ジャンル：${genre}`,
      `・価格：${price}（一点物）`,
      concept ? `・コンセプト：${concept}` : '',
      '',
      `一点物のため、ご購入はお早めに。`,
      `気になる方はDMまたはこちらから↓`,
      salesChannel,
      '',
      `「もう少し詳しく知りたい」という方は、返信いただければ詳細をお送りします😊`,
    ].filter(Boolean).join('\n'),

    sales_cta: [
      `【 ご購入・お問い合わせはこちら 】`,
      salesChannel,
      '',
      `一点物のため、他の方にご購入される場合もあります。`,
      `気になった方はお早めにご連絡ください😊`,
    ].join('\n'),

    delivery_notes: buildDeliveryNotes(),
  }
}

function genInquiry(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  pain1: string,
  desire1: string,
  salesChannel: string,
  lineUrl: string,
): Record<string, string> {
  let activities = 'アート・ワークショップ'
  let strengths = ''
  const senderName = '（名前・屋号）'

  if (source) {
    if (persona.sourceType === 'brand') {
      const b = source as Brand
      activities = b.activities || b.products || activities
      strengths = b.strengths?.slice(0, 60) || ''
    } else if (persona.sourceType === 'artwork') {
      const a = source as Artwork
      activities = `${a.genre}のカスタム・制作`
      strengths = a.features?.slice(0, 60) || ''
    } else {
      const w = source as Workshop
      activities = `${w.title}など各種ワークショップ`
      strengths = w.description?.slice(0, 60) || ''
    }
  }

  return {
    line_register_copy: [
      `${activities}に関するご相談は、LINEがいちばん気軽です。`,
      `「こんなことできますか？」という質問でも大歓迎。`,
      `まずは友だち追加してご連絡ください。`,
      `▼ 友だち追加はこちら`,
      lineUrl,
    ].join('\n'),

    register_benefit: [
      '▼ LINE登録の特典',
      '・個別相談を気軽に受け付け',
      '・お見積もりの相談（無料）',
      '・オーダー・カスタム案件の優先対応',
      '・制作事例・実績の詳細を直接共有',
      '',
      '（実際に提供できるものに編集してください）',
    ].join('\n'),

    greeting_message: [
      `友だち追加ありがとうございます！`,
      `${senderName}です😊`,
      '',
      `${activities}を提供しています。`,
      '',
      `どんな小さなことでも、`,
      `「こんなことできますか？」`,
      `「価格・納期を知りたい」`,
      `などお気軽にこのトークに返信してください。`,
      '',
      `必ず丁寧にご返信します👇`,
    ].join('\n'),

    message_1: [
      `改めて自己紹介させてください。`,
      '',
      `私は${senderName}として、${activities}を提供しています。`,
      strengths ? `\n${strengths}\n` : '',
      `${pain1 ? `「${pain1}」でお悩みの方の力になれたら嬉しいです。` : ''}`,
      '',
      `どんな相談でも気軽に返信してください。`,
      `まずはお話を聞かせてください！`,
    ].filter(Boolean).join('\n'),

    message_2: [
      `これまでにいただいたご相談の例をご紹介します。`,
      '',
      `・「○○をカスタムしてほしい」`,
      `・「記念品として作品を贈りたい」`,
      `・「出張でWSをお願いできますか？」`,
      '',
      `（実際の相談事例に編集してください）`,
      '',
      `こんな相談もOKです。まずは気軽に返信ください😊`,
    ].join('\n'),

    message_3: [
      `相談・お見積もりの流れをご説明します。`,
      '',
      `① このトークに返信してご要望をお聞かせください`,
      `② 内容を確認後、1〜2営業日以内にご返信`,
      `③ ご要望のヒアリング・お見積もりご提示`,
      `④ ご了承いただければ制作・実施へ`,
      '',
      `無料でご相談いただけます。`,
      `まずは返信から始めましょう👇`,
    ].join('\n'),

    sales_cta: [
      `【 ご相談・お問い合わせはこちら 】`,
      `このトークに返信 または`,
      salesChannel,
      '',
      `お気軽にどうぞ😊`,
    ].join('\n'),

    delivery_notes: buildDeliveryNotes(),
  }
}

function genRepeat(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  desire1: string,
  salesChannel: string,
  lineUrl: string,
): Record<string, string> {
  let productName = '（商品・サービス名）'
  const senderName = '（名前・屋号）'

  if (source) {
    if (persona.sourceType === 'artwork') productName = (source as Artwork).title
    else if (persona.sourceType === 'workshop') productName = (source as Workshop).title
    else productName = (source as Brand).name
  }

  return {
    line_register_copy: [
      `${productName}を購入・ご参加いただいた方へ。`,
      `LINEに登録すると、次回の新作・WS情報をいち早くお届けします。`,
      `購入者・参加者限定の特別情報も配信予定です。`,
      `▼ 友だち追加はこちら`,
      lineUrl,
    ].join('\n'),

    register_benefit: [
      '▼ リピーター向けLINE特典',
      '・新作・次回WS情報の先行案内',
      '・リピーター限定割引',
      '・購入者・参加者だけの限定情報',
      '・次回購入・参加の優先予約権',
      '',
      '（実際に提供できる特典に編集してください）',
    ].join('\n'),

    greeting_message: [
      `${productName}のご購入・ご参加、ありがとうございました！`,
      `${senderName}です😊`,
      '',
      `いかがでしたか？ぜひ感想を聞かせてください。`,
      '',
      `このアカウントでは、`,
      `・次回作・次回WSの先行案内`,
      `・リピーター限定の特別情報`,
      `をお届けします。`,
      '',
      `引き続きよろしくお願いします🙏`,
    ].join('\n'),

    message_1: [
      `先日はありがとうございました！`,
      '',
      `${productName}をお楽しみいただけていれば嬉しいです。`,
      '',
      `何かご不明な点や、使ってみた感想があれば`,
      `気軽に返信してください😊`,
      '',
      `今後も素敵な作品・体験をお届けできるよう頑張ります！`,
    ].join('\n'),

    message_2: [
      `今日は、次回の情報をご案内します。`,
      '',
      `${desire1 ? `「${desire1}」を叶える` : '新しい'}作品・WSを準備中です。`,
      '',
      `詳細が決まり次第こちらでご連絡します。`,
      `楽しみにしていてください！`,
      '',
      `「こんなものが欲しい」「こんなWSがあったら行きたい」`,
      `というご意見があればぜひ返信ください😊`,
    ].join('\n'),

    message_3: [
      `お待たせしました！新しい情報をお届けします。`,
      '',
      `（次回作・次回WSの詳細を記入してください）`,
      '',
      `リピーターの方限定で先行ご案内しています。`,
      `ご興味があればお早めにどうぞ。`,
      salesChannel,
    ].join('\n'),

    sales_cta: [
      `【 次回のご予約・ご購入はこちら 】`,
      salesChannel,
      '',
      `いつもありがとうございます😊`,
      `またお会いできるのを楽しみにしています！`,
    ].join('\n'),

    delivery_notes: buildDeliveryNotes('repeat'),
  }
}

function genFan(
  persona: Persona,
  source: Brand | Artwork | Workshop | null,
  desire1: string,
  phrase1: string,
  salesChannel: string,
  lineUrl: string,
): Record<string, string> {
  let activities = 'アート・制作活動'
  let concept = ''
  const senderName = '（名前・屋号）'

  if (source) {
    if (persona.sourceType === 'brand') {
      const b = source as Brand
      activities = b.activities || activities
      concept = b.strengths?.slice(0, 60) || ''
    } else if (persona.sourceType === 'artwork') {
      const a = source as Artwork
      activities = `${a.genre}の制作活動`
      concept = a.concept?.slice(0, 60) || ''
    } else {
      const w = source as Workshop
      activities = w.title
      concept = w.description?.slice(0, 60) || ''
    }
  }

  return {
    line_register_copy: [
      phrase1 ? `「${phrase1}」` : '制作の裏側・先行情報はLINEだけで公開。',
      `SNSでは話せないこだわりや制作秘話を、LINE登録者だけにお届けしています。`,
      `ファンの方はぜひ登録してください。`,
      `▼ 友だち追加はこちら`,
      lineUrl,
    ].join('\n'),

    register_benefit: [
      '▼ LINE登録の特典',
      '・制作裏話・こだわりの秘話（SNS非公開）',
      '・新作の一番乗り先行公開',
      '・限定コンテンツ・メッセージの配信',
      '・作家と直接つながれる特別な場',
      '',
      '（実際に提供できる特典に編集してください）',
    ].join('\n'),

    greeting_message: [
      `友だち追加ありがとうございます！`,
      `${senderName}です😊`,
      '',
      `このアカウントは、`,
      `SNSには載せない「制作の裏側」を届ける`,
      `ファン限定のチャンネルです。`,
      '',
      desire1 ? `「${desire1}」を大切にしている方と` : 'アート・ものづくりが好きな方と',
      `つながれることが嬉しいです。`,
      '',
      `これからよろしくお願いします🙏`,
    ].filter(Boolean).join('\n'),

    message_1: [
      `改めて自己紹介させてください。`,
      '',
      `${activities}を中心に活動している${senderName}です。`,
      concept ? `\n「${concept}」` : '',
      `という想いで制作しています。`,
      '',
      `ここでは、制作中のこぼれ話や`,
      `SNSでは伝えきれない想いをお届けしていきます。`,
      '',
      `どんなことに興味がありますか？ぜひ返信ください！`,
    ].filter(Boolean).join('\n'),

    message_2: [
      `今日は、制作裏話をお届けします。`,
      '',
      `（制作中のエピソード・こだわり・失敗談等を記入してください）`,
      '',
      `こういった話をSNSで全部伝えるのは難しいので、`,
      `LINEで登録してくれた方だけに話しています😊`,
      '',
      `「もっとこういう話が聞きたい！」があれば返信ください。`,
    ].join('\n'),

    message_3: [
      `LINE登録者の方に、先行でお知らせです。`,
      '',
      `（新作・新企画の詳細を記入してください）`,
      '',
      phrase1 ? `「${phrase1}」` : '',
      `そんな思いで作りました。ぜひ見てください。`,
      '',
      `ご購入・ご参加はこちら↓`,
      salesChannel,
    ].filter(Boolean).join('\n'),

    sales_cta: [
      `【 先行情報・詳細はこちら 】`,
      salesChannel,
      '',
      `気になった方はこのトークに返信いただければ`,
      `詳しくお伝えします😊`,
    ].join('\n'),

    delivery_notes: buildDeliveryNotes('fan'),
  }
}

// ─── 共通：配信注意点 ─────────────────────────────────────

function buildDeliveryNotes(goal?: string): string {
  const base = [
    '▼ 配信時の注意点',
    '',
    '【関係づくり → 販売 の流れを守る】',
    '・1通目・2通目は価値提供（自己紹介・情報・共感）を優先する',
    '・「売り込み」は3通目以降 または 信頼が積み上がってから',
    '・宣伝と価値提供の比率は 3:7 を目安にする',
    '',
    '【頻度・タイミング】',
    '・週1〜2回が目安（多すぎるとブロックされやすい）',
    '・最初の2週間は頻度を上げて関係構築、その後は週1回に落ち着かせる',
    '・送信は夜20〜22時 または 昼12〜13時がおすすめ',
    '',
    '【本文のポイント】',
    '・200〜400文字が理想（LINEは長文が読まれにくい）',
    '・文末に「返信してください」「教えてください」と呼びかける',
    '・長い説明は「続きはこちら↓」でLPへ誘導する',
    '',
    '【ブロック・配信停止を防ぐ】',
    '・告知だけでなく、役立つ情報・感情に響く話を定期的に届ける',
    '・返信が来たら必ず返す（信頼の積み上げになる）',
    '・「役に立った」「見てよかった」と思われる配信を意識する',
  ]

  if (goal === 'repeat') {
    base.push('', '【リピーター向け追加ポイント】', '・購入・参加後24時間以内に感謝メッセージを送る', '・次回案内は「先行特典付き」で送ると効果的', '・「次はこんな商品・WSが出ます」という予告で期待感を作る')
  } else if (goal === 'fan') {
    base.push('', '【ファン向け追加ポイント】', '・SNSには載せない「制作の裏側」や「失敗談」を積極的にシェアする', '・返信に丁寧に対応して「特別な場所」という感覚を大切にする', '・ファン限定の特別感（先行公開・限定情報）を継続して提供する')
  }

  return base.join('\n')
}
