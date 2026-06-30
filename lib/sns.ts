import type {
  SnsStrategyGoal,
  SnsStrategyPlatform,
  SnsStrategySection,
  MarketingPhaseLink,
  Persona,
  ContentDraft,
  LandingPageDraft,
  LineStrategyDraft,
  Brand,
  Artwork,
  Workshop,
} from '@/types'

// ─── 設定定数 ─────────────────────────────────────────────

export const SNS_GOAL_CONFIG: Record<
  SnsStrategyGoal,
  { label: string; phase: MarketingPhaseLink; defaultCta: string; defaultWeekly: number }
> = {
  awareness:     { label: '認知拡大',       phase: 'awareness',    defaultCta: 'フォローして最新作をチェック',    defaultWeekly: 5 },
  ws_booking:    { label: 'WS集客',          phase: 'acquisition',  defaultCta: 'ワークショップに申し込む',        defaultWeekly: 4 },
  artwork_sales: { label: '作品販売',        phase: 'sales',        defaultCta: '作品の詳細・購入はこちら',        defaultWeekly: 4 },
  line_register: { label: 'LINE登録',        phase: 'acquisition',  defaultCta: 'LINEで先行情報を受け取る',        defaultWeekly: 5 },
  fan:           { label: 'ファン化',        phase: 'retention',    defaultCta: 'プロフィールをフォロー',          defaultWeekly: 4 },
  repeat:        { label: 'リピーター化',    phase: 'retention',    defaultCta: '次回も一緒に楽しみましょう',      defaultWeekly: 3 },
}

export const SNS_PLATFORM_CONFIG: Record<
  SnsStrategyPlatform,
  { label: string; emoji: string; primaryUse: string; postUnit: number }
> = {
  x:           { label: 'X',          emoji: '𝕏', primaryUse: 'テキスト+画像、拡散力重視',   postUnit: 2 },
  instagram:   { label: 'Instagram',  emoji: '📸', primaryUse: 'ビジュアル重視、ストーリー',   postUnit: 2 },
  facebook:    { label: 'Facebook',   emoji: '📘', primaryUse: '長文+コミュニティ連携',        postUnit: 1 },
  youtube:     { label: 'YouTube',    emoji: '▶️', primaryUse: 'ショート・制作プロセス動画',    postUnit: 1 },
  tiktok:      { label: 'TikTok',     emoji: '🎵', primaryUse: '短尺動画、トレンド乗り',        postUnit: 2 },
  threads:     { label: 'Threads',    emoji: '🧵', primaryUse: 'テキスト+画像、Insta連携',     postUnit: 1 },
}

export const SNS_SECTION_KEYS = [
  'platform_policy',
  'post_themes',
  'key_strengths',
  'post_flow',
  'conversion_cta',
  'weekly_plan',
  'avoid_content',
  'next_actions',
] as const

const SNS_SECTION_META: Record<string, { label: string; hint: string }> = {
  platform_policy: { label: '媒体別の投稿方針',      hint: '各SNS媒体でどのような投稿をするか、トーン・頻度・フォーマットの方針を記述してください' },
  post_themes:     { label: '投稿テーマ一覧',         hint: 'ペルソナに刺さる投稿テーマを複数挙げてください（制作過程・ビフォーアフター・制作秘話 など）' },
  key_strengths:   { label: '投稿で伝える強み',       hint: 'SNS発信を通じて訴求する作家・作品・WSの強みポイントを整理してください' },
  post_flow:       { label: '投稿からの導線設計',     hint: 'SNS投稿→プロフィール→LP→LINEへとつながるフロー設計を記述してください' },
  conversion_cta:  { label: 'LINE/LP誘導CTA文言',     hint: '投稿末尾やストーリーズで使うLINE登録・LP閲覧への誘導文言を複数書いてください' },
  weekly_plan:     { label: '週間投稿プラン',         hint: '曜日ごとの投稿内容・テーマ・フォーマット（静止画/動画/テキスト）を組み立ててください' },
  avoid_content:   { label: '避けるべき投稿・NG事項', hint: 'ブランドイメージや購買促進を損ねる投稿パターン・NG事項を明記してください' },
  next_actions:    { label: '今週やるべきネクストアクション', hint: 'この戦略を実行するためにすぐ着手できる具体的なアクション3〜5件を書いてください' },
}

// ─── 生成パラメータ ───────────────────────────────────────

type Source = Brand | Artwork | Workshop

type GenParams = {
  goal: SnsStrategyGoal
  platforms: SnsStrategyPlatform[]
  persona: Persona
  source: Source
  referencedContent?: ContentDraft | null
  referencedLp?: LandingPageDraft | null
  referencedLine?: LineStrategyDraft | null
}

// ─── ヘルパー ─────────────────────────────────────────────

function platformList(platforms: SnsStrategyPlatform[]): string {
  return platforms.map((p) => SNS_PLATFORM_CONFIG[p].label).join('・')
}

function sourceName(source: Source): string {
  if ('title' in source) return source.title
  if ('name' in source) return (source as Brand).name
  return ''
}

function sourceStrengths(source: Source): string {
  if ('strengths' in source) return (source as Brand).strengths
  if ('features' in source) return (source as Artwork).features
  if ('description' in source) return (source as Workshop).description
  return ''
}

function sourceTarget(source: Source): string {
  if ('targetAudience' in source) return (source as Workshop).targetAudience
  if ('targetCustomer' in source) return (source as Brand | Artwork).targetCustomer
  return ''
}

function calcWeeklyPostCount(platforms: SnsStrategyPlatform[], goal: SnsStrategyGoal): number {
  const base = platforms.reduce((sum, p) => sum + SNS_PLATFORM_CONFIG[p].postUnit, 0)
  const multiplier = goal === 'awareness' ? 1.2 : goal === 'repeat' ? 0.9 : 1.0
  return Math.round(base * multiplier * 2.5)
}

// ─── セクション生成関数 ───────────────────────────────────

function genPlatformPolicy(p: GenParams): string {
  const platformDetails = p.platforms.map((platform) => {
    const cfg = SNS_PLATFORM_CONFIG[platform]
    const goalCfg = SNS_GOAL_CONFIG[p.goal]
    const personaChannel = p.persona.usedChannels.includes(cfg.label)
      ? '（ペルソナが頻用するチャネル）'
      : ''

    const strategies: Record<SnsStrategyPlatform, Record<SnsStrategyGoal, string>> = {
      instagram: {
        awareness:     `制作プロセス・完成作品のビジュアルを中心に投稿。Reels（15〜30秒）で制作シーンを見せ、フィード投稿では完成した作品の世界観を伝える。ハッシュタグ10〜15個を活用して発見されやすくする。`,
        ws_booking:    `WSの雰囲気・参加者の笑顔・完成作品をビジュアルで見せる。ストーリーズでQ&A・残席カウントダウンを活用。Reelsで「WSの1日」を短く紹介する投稿を毎週実施。`,
        artwork_sales: `作品の細部・素材感・インテリアに飾った際のイメージをカルーセルで投稿。購入者のレビューや飾った写真もリポスト。価格・サイズをキャプションに必ず記載。`,
        line_register: `投稿末尾に「LINE登録で先行案内」テキスト+リンクスタンプを添付。ストーリーズのリンクスタンプでLINEに直接誘導。プロフィールのリンクを定期的に案内。`,
        fan:           `作家の日常・制作秘話・失敗談などを投稿してパーソナリティを見せる。Q&Aボックスやアンケートで双方向交流を増やし、コメント返信を必ず実施。`,
        repeat:        `既存顧客に向けた「次回作品予告」「WS新日程」をストーリーズで先行案内。フォロワー限定コンテンツや裏話投稿でリピート動機を醸成。`,
      },
      x: {
        awareness:     `制作過程ツイート+画像で認知拡大。完成作品のビフォーアフターをスレッドで投稿。人気ハッシュタグ（#アート #ハンドメイド等）に乗る形で投稿する。`,
        ws_booking:    `WSの告知は1〜2週前から複数回投稿。「残席○席」「参加者の声」をリプライで紹介。WSの日に「当日ライブ」ツイートで臨場感を出す。`,
        artwork_sales: `作品画像+短い説明+購入リンクで投稿。「作品完成のお知らせ」スレッドで制作背景→完成→購入案内の流れを作る。`,
        line_register: `「LINE登録でWS先行案内」「LINE限定作品情報」を定期的にツイート。プロフィールのリンクを常にLINE登録ページに設定。`,
        fan:           `制作中のつぶやき・インプレッション多い投稿への返信・フォロワーとの交流を中心に。作家としての考え方や哲学も混ぜてキャラクターを確立。`,
        repeat:        `既存顧客向けに「次回作品予告」「次期WSの先行案内」を投稿。「ありがとう」報告投稿でコミュニティ感を醸成。`,
      },
      facebook: {
        awareness:     `Facebookページで制作日記・作品紹介を長文で投稿。地元・趣味グループにイベント情報をシェア。広告活用時のベースにもなるため情報量多めに投稿する。`,
        ws_booking:    `Facebookイベントを作成してWSを登録。友人・既存顧客からの参加表明が口コミになる。グループ告知も有効。`,
        artwork_sales: `作品の制作背景・コンセプトを長文で説明した投稿。購入者の感想コメントを重視。Facebookショップ設定も検討。`,
        line_register: `Facebookの「連絡先」にLINEリンクを掲載。投稿末尾に誘導文言を添付。`,
        fan:           `制作過程の長文ストーリー投稿。コメント欄でのやり取りを丁寧に実施。Facebookグループを活用してコミュニティを育てる。`,
        repeat:        `過去参加者・購入者へのお礼投稿。ニュースレター代わりに「今月のアトリエ便り」を投稿。`,
      },
      youtube: {
        awareness:     `制作プロセス動画（タイムラプス・解説付き）をアップ。ショート動画で完成シーンのインパクトを見せる。検索されやすいタイトル（「スニーカーペイント やり方」等）で認知獲得。`,
        ws_booking:    `「WSレポート動画」「体験者インタビュー」をアップ。次回WSの告知をend card・概要欄に記載。`,
        artwork_sales: `「作品完成までの全工程」「制作の裏側」動画で作品への愛着を深める。概要欄に購入リンクを必ず記載。`,
        line_register: `動画末尾に「LINE登録で先行案内」テロップ+概要欄にリンク。`,
        fan:           `作家の考え方・日常をVlogとして配信。コメントへの返信動画なども効果的。`,
        repeat:        `「アフターケア動画」「作品の飾り方」など購入後に役立つ動画でロイヤルティを高める。`,
      },
      tiktok: {
        awareness:     `15〜30秒の制作過程ショート動画。「ビフォーアフター」フォーマットが特に拡散しやすい。トレンド音楽を活用してレコメンドされやすくする。`,
        ws_booking:    `「WS体験30秒ダイジェスト」動画。参加者の驚きの表情や完成作品へのリアクションを撮影して投稿。`,
        artwork_sales: `作品の細部をアップで撮影する「完成披露」動画。「これいくら？」コメントを誘発するような見せ方を意識。`,
        line_register: `動画の概要欄・コメント欄に「詳細はLINEで」を記載。プロフィールのリンクをLINE登録ページに設定。`,
        fan:           `「アーティストの1日」「制作の失敗談」など人間味ある動画で共感を獲得。デュエット・ステッチで他クリエイターとの交流も。`,
        repeat:        `「お客様の作品/購入品」紹介でリポスト。「次回作品予告」をショート動画で先行公開。`,
      },
      threads: {
        awareness:     `Instagram連携で制作投稿をThreadsにも展開。テキスト中心に作家の考え・日常をシェア。Instagram未フォローの層へのリーチに活用。`,
        ws_booking:    `WS告知・参加募集をThreadsでも展開。InstagramのWSストーリーをThreadsにも流す。`,
        artwork_sales: `作品完成の「第一報」をThreadsで投稿し、詳細はInstagramへ誘導。`,
        line_register: `Threadsプロフィールにも「LINE登録はこちら」リンクを設定。`,
        fan:           `制作の思い・日々の気づきをテキスト投稿でシェア。Instagramより気軽な雰囲気でパーソナリティを出す。`,
        repeat:        `既存フォロワー向けの先行情報・裏話投稿でエンゲージメントを維持。`,
      },
    }

    const strategy = strategies[platform]?.[p.goal] ?? `${cfg.primaryUse}を活用して${goalCfg.label}を目指す。`

    return `【${cfg.label}${personaChannel}】
${strategy}`
  }).join('\n\n')

  return `■ SNS目的：${SNS_GOAL_CONFIG[p.goal].label} ／ 使用媒体：${platformList(p.platforms)}

${platformDetails}

▶ 統一方針：
・全媒体でプロフィールに「${p.persona.salesChannelFit}」への誘導を設定
・投稿のトーン：${p.persona.resonantPhrases[0] ? `ペルソナに刺さるキーワード「${p.persona.resonantPhrases[0]}」を意識した` : '親しみやすく誠実な'}語り口
・ペルソナ（${p.persona.name}）が最も使う「${p.persona.usedChannels.slice(0, 2).join('・')}」を主力チャネルとして強化`
}

function genPostThemes(p: GenParams): string {
  const sn = sourceName(p.source)
  const ss = sourceStrengths(p.source)
  const pain = p.persona.pains[0] ?? '日々の忙しさ'
  const desire = p.persona.desires[0] ?? '暮らしに彩りを加えたい'

  const themeSets: Record<SnsStrategyGoal, string[]> = {
    awareness: [
      `① 制作プロセス：「${sn}」が完成するまでの工程をビジュアルで見せる（最もエンゲージが高いシリーズ）`,
      `② ビフォーアフター：素材→作品への劇的変化を1枚〜カルーセルで投稿`,
      `③ 素材・道具紹介：使用する素材・道具の特徴と選んだ理由を紹介`,
      `④ 制作失敗談：うまくいかなかったエピソード＋学び（共感・信頼獲得）`,
      `⑤ 作品の世界観：完成作品の「想い・コンセプト」を語るキャプション重視投稿`,
      `⑥ アーティストの日常：スタジオ・作業環境・愛用ツールの紹介`,
    ],
    ws_booking: [
      `① WS体験レポート：参加者の表情・完成作品・雰囲気を紹介`,
      `② 「${pain}」に共感する投稿：「忙しい毎日でも、2時間だけ夢中になれる場所」など`,
      `③ 初心者でも大丈夫な理由：道具持参不要・材料費込み・丁寧サポートを強調`,
      `④ 完成作品自慢：参加者の作品を（許可を得て）紹介して期待感を高める`,
      `⑤ 講師紹介：制作への想い・教えることへのこだわりを語る`,
      `⑥ 残席・日程告知：「残○席」「次回は○月○日」など緊急性を持たせた投稿`,
    ],
    artwork_sales: [
      `① 作品の「こだわり」紹介：${ss.slice(0, 30)}を詳しく説明`,
      `② 飾ったイメージ：実際の生活空間・インテリアに合わせた写真`,
      `③ 制作背景・ストーリー：この作品を作ろうと思ったきっかけ・込めた想い`,
      `④ 購入者の感想：レビュー・使用シーンの写真（許可を得てシェア）`,
      `⑤ 「${desire}」をかなえる作品：ペルソナの願望に直接訴えるコピー投稿`,
      `⑥ 価格・購入方法案内：明確な価格・購入ステップを定期的に投稿`,
    ],
    line_register: [
      `① LINE登録特典の案内：「先行情報」「限定クーポン」「制作秘話」などベネフィット訴求`,
      `② 「知らないと損」系投稿：次回WS・新作情報をLINEでのみ先行公開`,
      `③ 登録方法説明投稿：QRコード画像・ステップを分かりやすく説明`,
      `④ 既存LINE読者の声：「登録してよかった」感想を投稿（社会的証明）`,
      `⑤ ペルソナの悩み投稿 + LINE解決提案：「${pain}」→「LINEで解決策をお届け中」`,
      `⑥ 限定コンテンツ予告：次回LINE配信内容を予告してLINE登録を促進`,
    ],
    fan: [
      `① 作家の考え方・哲学：なぜこの活動をしているか、大切にしていること`,
      `② 制作中のリアルなつぶやき：悩み・発見・嬉しかった瞬間`,
      `③ 「${p.persona.name}へ」メッセージ：ターゲット読者に語りかける投稿`,
      `④ お客様との関係性：感謝メッセージ・エピソード紹介`,
      `⑤ 共感を呼ぶ日常：${p.persona.pains[1] ?? 'アートのある日常'}に共感できるエピソード`,
      `⑥ コラボ・影響を受けたアーティスト紹介：文化的文脈でブランドを位置づける`,
    ],
    repeat: [
      `① 新作・次回WS予告：既存顧客向けの「ファースト案内」投稿`,
      `② アフターケア情報：購入作品の飾り方・メンテナンス方法`,
      `③ 購入者コミュニティ紹介：同じ趣味を持つ人たちのつながりを見せる`,
      `④ 季節・行事に合わせた投稿：「年末のおうちに新しい一枚を」など時期訴求`,
      `⑤ 感謝・周年投稿：続けてきた感謝と次のステージへの意気込み`,
      `⑥ 「2度目はもっと深く」訴求：リピートで得られる新しい価値・気づき`,
    ],
  }

  const themes = themeSets[p.goal] ?? themeSets.awareness

  return `■ ペルソナ「${p.persona.name}」に刺さる投稿テーマ（目的：${SNS_GOAL_CONFIG[p.goal].label}）

${themes.join('\n')}

▶ コンテンツカレンダーのポイント：
・①②を毎週必ず1回ずつ、③〜⑥は週替わりでローテーション
・参照コンテンツ「${p.referencedContent?.content?.slice(0, 30) ?? sn}」の内容をSNS用に再編集して活用
・新作完成・WS開催の1〜2週前は③〜⑥から緊急性高い投稿を増やす`
}

function genKeyStrengths(p: GenParams): string {
  const ss = sourceStrengths(p.source)
  const sn = sourceName(p.source)
  const pain1 = p.persona.pains[0] ?? '日々の忙しさや閉塞感'
  const desire1 = p.persona.desires[0] ?? '特別な体験・ものを持ちたい'
  const desire2 = p.persona.desires[1] ?? '暮らしに彩りを加えたい'
  const resonant = p.persona.resonantPhrases.slice(0, 3).join('・') || '唯一無二・手仕事の温もり・本物志向'

  return `■ SNSで一貫して伝えるべき強みポイント

【強み①】唯一無二の手作り価値
・${sn}は量産品には出せない「世界に1つだけ」の質感・表情がある
・${ss.slice(0, 60)}
→ 投稿コピー例：「同じものは2つとない。これだけが『あなただけの1枚』です」

【強み②】ペルソナの悩みへの直接的な応え
・ターゲット「${p.persona.name}」の悩み：${pain1}
・この作品/サービスがその悩みを解決する理由：欲しかった未来「${desire1}」を体験・所有できる
→ 投稿コピー例：「${desire1}を、アートで叶える」

【強み③】作家・人としての信頼性
・継続的な制作発信によって形成する「この人から買いたい」感覚
・制作への誠実な姿勢・技術・こだわりを発信し続けることで信頼を蓄積
→ 投稿コピー例：「丁寧に作ること。それが唯一のこだわりです」

【ペルソナに刺さるキーワード】
・${resonant}
・「${desire2}」を叶える手段としてのポジショニングを全媒体で統一`
}

function genPostFlow(p: GenParams): string {
  const lpUrl = p.referencedLp?.lineRegistrationUrl || p.referencedLine?.lineRegistrationUrl || '（LP/LINE URL）'
  const lineUrl = p.referencedLine?.lineRegistrationUrl || lpUrl

  const flowsByGoal: Record<SnsStrategyGoal, string> = {
    awareness: `SNS投稿（認知）
  ↓ 「続きが気になる」「フォローしたい」
プロフィール閲覧
  ↓ 「もっと見たい」
過去投稿・ハイライトを見る
  ↓ 「この人の世界観が好き」
フォロー → LINE登録 → WS/購入検討`,

    ws_booking: `SNS投稿（WS紹介・参加者の声）
  ↓ 「楽しそう、参加してみたい」
プロフィールのリンクをクリック
  ↓
LP（${lpUrl}）で詳細確認
  ↓ 「申し込もう」
申し込みフォーム → 決済完了`,

    artwork_sales: `SNS投稿（作品の魅力・制作背景）
  ↓ 「欲しい・問い合わせたい」
プロフィールのリンクをクリック
  ↓
LP（${lpUrl}）で作品詳細確認
  ↓ 「購入/問い合わせ」
購入フォーム・DM問い合わせ → 決済`,

    line_register: `SNS投稿（LINE特典の告知・限定情報予告）
  ↓ 「登録しないと損」
プロフィールのLINEリンクをタップ
  ↓
LINE友だち追加（${lineUrl}）
  ↓
グリーティングメッセージ受信 → ステップ配信 → 購入`,

    fan: `SNS投稿（人柄・制作哲学・日常）
  ↓ 「この人のことをもっと知りたい」
プロフィール閲覧 → 過去投稿をさかのぼる
  ↓ 「フォロー・LINE登録・コメント」
コミュニケーション深化（コメント・DM）
  ↓
ロイヤルファン化 → 作品購入・WS参加 → 口コミ`,

    repeat: `SNS投稿（新作予告・季節提案・感謝投稿）
  ↓ 「また欲しい・また参加したい」
プロフィールのリンクをクリック
  ↓
LP・申し込みページ（${lpUrl}）
  ↓ 「リピート申し込み・購入」
お客様との長期関係構築`,
  }

  return `■ SNS投稿 → 購入・登録 への導線設計（目的：${SNS_GOAL_CONFIG[p.goal].label}）

${flowsByGoal[p.goal]}

▶ 導線設計のチェックポイント：
□ 全媒体のプロフィール URL に「${lpUrl}」を設定済みか
□ 投稿のキャプション末尾に「プロフィールのリンクから」誘導文を入れているか
□ Instagram はストーリーズのリンクスタンプも活用しているか
□ X はプロフィールの「ウェブサイト」欄にLINE/LP URLを設定しているか
□ 投稿→プロフィール→LP→登録/購入 の各ステップで離脱しないか定期確認`
}

function genConversionCta(p: GenParams): string {
  const lineUrl = p.referencedLine?.lineRegistrationUrl
    || p.referencedLp?.lineRegistrationUrl
    || '（LINE登録URL）'
  const lpUrl = p.referencedLp
    ? `（LPページURL）`
    : '（LPページURL）'
  const snsCtaFromLine = p.referencedLine?.snsCtaText || ''

  const ctasByGoal: Record<SnsStrategyGoal, string[]> = {
    awareness: [
      `「最新作はプロフィールのリンクからチェックできます →」`,
      `「フォローすると新作をいち早く受け取れます。ぜひフォローを♪」`,
      `「制作過程動画はストーリーズにも投稿しています。ハイライトもぜひ」`,
    ],
    ws_booking: [
      `「次回WSの詳細・お申し込みはプロフィールのリンクから→ ${lpUrl}」`,
      `「残席あとわずか。お申し込みはお早めに（詳細はリンクから）」`,
      `「気になる方はDMかLINEでお気軽に聞いてください」`,
    ],
    artwork_sales: [
      `「詳細・ご購入・お問い合わせはプロフィールのリンクから → ${lpUrl}」`,
      `「DMでも購入相談OK。お気軽にご連絡ください」`,
      `「只今1点ものにつき売り切れ御免。お早めにどうぞ」`,
    ],
    line_register: [
      `「LINE登録で新作・WS先行案内を受け取れます → ${lineUrl}」`,
      `「プロフィールのリンクからLINE友だち追加するだけ。登録無料です」`,
      `「LINE限定のお得情報・制作秘話を配信中。ぜひご登録を」`,
      ...(snsCtaFromLine ? [`「${snsCtaFromLine}」（LINE戦略から引き継ぎ）`] : []),
    ],
    fan: [
      `「もっと詳しく知りたい方はLINE登録がおすすめです → ${lineUrl}」`,
      `「フォロー&コメントお待ちしています。皆さんの感想が励みになります」`,
      `「制作の裏話はLINEでお届けしています。よければご登録を」`,
    ],
    repeat: [
      `「次回WSのご案内はLINEで先行配信中 → ${lineUrl}」`,
      `「また一緒に楽しみましょう。詳細はプロフィールリンクから」`,
      `「いつもありがとうございます。次回の限定情報はLINEで」`,
    ],
  }

  const ctas = ctasByGoal[p.goal]

  return `■ 投稿末尾・ストーリーズで使うCTA文言集（目的：${SNS_GOAL_CONFIG[p.goal].label}）

${ctas.map((c, i) => `【CTA${i + 1}】${c}`).join('\n\n')}

▶ CTA活用のルール：
・1投稿にCTAは1つだけ（複数入れると迷ってスルーされる）
・文章の締めくくりに自然な流れで入れる
・ストーリーズはリンクスタンプ + テキスト誘導を組み合わせる
・週に1回はプロフィールリンクを案内する「CTA専用投稿」を入れる`
}

function genWeeklyPlan(p: GenParams): string {
  const weeklyCount = calcWeeklyPostCount(p.platforms, p.goal)
  const platformLabels = platformList(p.platforms)

  const dayPlans: Record<SnsStrategyGoal, string[]> = {
    awareness: [
      `【月曜】制作プロセス写真/動画 — 今週の制作スタートを投稿（${platformLabels}）`,
      `【水曜】作品完成・ビフォーアフター投稿 — 完成作品のビジュアルを全力で見せる`,
      `【木曜】素材・道具紹介 または 作家の日常 — キャラクターを見せる投稿`,
      `【土曜】インタラクション投稿 — アンケート・Q&A・コメント返信でエンゲージメントを上げる`,
      `【日曜】週まとめ / 来週の予告 — 次の投稿への期待感を作る`,
    ],
    ws_booking: [
      `【月曜】WS体験レポート / 参加者の声 — 「こんなに楽しそう」を見せる（${platformLabels}）`,
      `【水曜】初心者向け安心情報 — 「誰でもできる」「道具不要」などハードル低い投稿`,
      `【金曜】残席・日程告知 — 緊急性を持たせた申し込み促進投稿`,
      `【土曜】制作プロセス動画 — WS内容の紹介を兼ねた制作ショート動画`,
      `【日曜】質問・FAQ投稿 — よくある質問に答えて不安を解消`,
    ],
    artwork_sales: [
      `【火曜】新作・制作中作品の紹介 — 今週の作品進捗を投稿（${platformLabels}）`,
      `【木曜】作品の「こだわり」深掘り — 素材・技法・制作背景を語る`,
      `【金曜】購入方法・価格案内 — 明確な情報を投稿して購入ハードルを下げる`,
      `【土曜】飾った実例 / 購入者の声 — インテリアイメージ・レビューを投稿`,
      `【日曜】来週の新作予告 — 期待感を作るティザー投稿`,
    ],
    line_register: [
      `【月曜】LINE限定コンテンツ予告 — 「今週のLINEでは○○を配信」と告知（${platformLabels}）`,
      `【水曜】登録ベネフィット訴求 — 「登録するとこんな情報が届く」を具体的に投稿`,
      `【金曜】「登録方法」説明投稿 — QRコード付き・ステップ解説で登録を後押し`,
      `【土曜】制作プロセス投稿（認知拡大） — 新フォロワーを増やしてからLINEへ誘導`,
      `【日曜】LINE読者の声 / 特典紹介 — 社会的証明を入れた登録促進投稿`,
    ],
    fan: [
      `【月曜】制作の想い・哲学投稿 — 「なぜこの仕事をしているか」を語る（${platformLabels}）`,
      `【水曜】お客様との交流エピソード — 嬉しかった感想・出会いのストーリー`,
      `【木曜】制作リアルつぶやき — うまくいかなかったこと・発見・正直な気持ち`,
      `【土曜】作品完成 + 想いのキャプション — 作品に込めたものを丁寧に語る`,
      `【日曜】感謝・コミュニティ投稿 — フォロワーへの感謝、一緒に作るコミュニティ感`,
    ],
    repeat: [
      `【月曜】新作・次回WS予告 — 「また楽しみましょう」の第一報（${platformLabels}）`,
      `【水曜】アフターケア / 活用情報 — 購入者・参加者の役に立つ情報`,
      `【金曜】季節・タイミング訴求 — 「○○シーズンに新しい1枚を」など時期に合わせた投稿`,
      `【日曜】コミュニティ感謝投稿 — 「いつもありがとうございます」の温かい投稿`,
    ],
  }

  const plans = dayPlans[p.goal] ?? dayPlans.awareness

  return `■ 週間投稿プラン（目的：${SNS_GOAL_CONFIG[p.goal].label}、媒体：${platformLabels}）

推奨週間投稿数：約${weeklyCount}件

${plans.join('\n')}

▶ 実施のコツ：
・月曜朝/土曜午後 が最もエンゲージメントが高い時間帯
・ストーリーズは毎日更新（フィード投稿の補完として活用）
・投稿は作業の合間にスマホで予約投稿ツール（Meta Business Suite等）を活用
・週に1回、投稿の「いいね数・保存数・プロフィールアクセス数」を確認して調整`
}

function genAvoidContent(p: GenParams): string {
  return `■ 避けるべき投稿・NG事項（ブランドイメージ保護）

【NG①】価格や購入方法が不明確な投稿のまま放置
・作品・WSの投稿に「価格はDMで」「詳細は問い合わせを」だけでは購入ハードルが上がる
→ 必ず概要欄・キャプション末尾に価格帯 or リンクを入れる

【NG②】競合・他アーティストの批判・比較
・「他の安いものとは違う」「一般的なWSとは違って」などネガティブ比較はブランドイメージを損なう
→ 自分の強みを「ポジティブ表現」で語る

【NG③】宣伝だけの投稿が連続する
・「買ってください」「申し込んでください」だけの投稿が3日以上続くとフォロー解除されやすい
→ 価値提供（制作秘話・有益情報）と告知を7:3の割合で維持

【NG④】ペルソナとズレたターゲット層向けの投稿
・${p.persona.name}（${p.persona.age}・${p.persona.occupation}）に響かないコンテンツは希薄化につながる
→ 投稿する前に「${p.persona.name}がこれを見て心が動くか？」を自問する

【NG⑤】プライバシーに配慮しない写真・情報
・購入者・参加者の顔写真・個人情報は必ず許可を取ってから投稿
・顧客のDM内容を無断でスクリーンショット投稿しない

【NG⑥】過度なフィルター加工で実物と大幅に異なる見た目
・作品の色・質感が実物と乖離すると返品・クレームの原因になる
→ 明るさ調整は可、色相・彩度の大幅変更は不可`
}

function genNextActions(p: GenParams): string {
  const sn = sourceName(p.source)
  const lineUrl = p.referencedLine?.lineRegistrationUrl
    || p.referencedLp?.lineRegistrationUrl
    || ''

  const actionsByGoal: Record<SnsStrategyGoal, string[]> = {
    awareness: [
      `□ 各SNSのプロフィール文を「${sn}のアーティスト」と分かるよう統一する`,
      `□ 過去の制作写真から「ビフォーアフター」投稿用の素材を3セット選ぶ`,
      `□ 今週の制作プロセスをスマホで撮影（15秒の動画 + 写真3枚が目安）`,
      `□ 投稿スケジュールを今週分だけカレンダーに入れる`,
      `□ ハッシュタグリストを20個作成してメモアプリに保存する`,
    ],
    ws_booking: [
      `□ 過去WSの参加者写真・完成作品写真を整理して投稿素材を確保する`,
      `□ LP（${p.referencedLp ? 'LP案を参照' : '今後作成'}）のURLをプロフィールに設定する`,
      `□ 次回WS日程を決めて、告知スケジュール（2週前・1週前・前日）を組む`,
      `□ 「よくある質問」を3つ作って投稿コンテンツに変換する`,
      `□ ストーリーズで「WS参加してみたい？」アンケートを実施してニーズを確認`,
    ],
    artwork_sales: [
      `□ 現在販売中の作品を全て撮影し直す（白背景 + ナチュラル光が基本）`,
      `□ 各作品のキャプションテンプレートを作成（タイトル・サイズ・素材・価格・購入先）`,
      `□ LP（${p.referencedLp ? 'LP案を参照' : '今後作成'}）のURLをプロフィールに設定する`,
      `□ 「制作背景ストーリー」を1作品分書いてみる（投稿コピーの練習）`,
      `□ 購入者1名に感想をお願いして、次回の投稿素材にする`,
    ],
    line_register: [
      lineUrl ? `□ LINE登録URL（${lineUrl}）を全媒体のプロフィールに設定する` : `□ LINE公式アカウントを開設してLINE登録URLを取得する`,
      `□ 「LINE登録の特典・メリット」を3つ決めて投稿コンテンツ化する`,
      `□ LINE登録用QRコード画像を作成（投稿用・印刷用の両方）`,
      `□ ストーリーズにリンクスタンプを設置してLINEへの誘導を自動化する`,
      `□ 今週中に「LINE登録してみませんか？」投稿を1本出す`,
    ],
    fan: [
      `□ 「なぜこの活動をしているか」を300文字で書いてみる（投稿原稿として活用）`,
      `□ 過去1ヶ月で最もコメント・反応が多かった投稿を分析する`,
      `□ フォロワーへの返信を今日中に全て実施する（エンゲージメント向上）`,
      `□ 制作の失敗談 or 感動エピソードを1つ投稿コンテンツ化する`,
      `□ 来週1回「Q&A投稿」をして読者との双方向交流を増やす`,
    ],
    repeat: [
      `□ 過去購入者・参加者リストを整理してLINEにいる人の割合を確認する`,
      `□ 「リピーター向け先行案内」LINEメッセージを1本作成する`,
      `□ 次回作品・WSの予告投稿を今週末に出す準備をする`,
      `□ 過去参加者・購入者に「その後どうですか？」メッセージを送る`,
      `□ アフターケア情報（作品の飾り方・メンテナンス）を1投稿分まとめる`,
    ],
  }

  const actions = actionsByGoal[p.goal] ?? actionsByGoal.awareness

  return `■ 今週やるべきネクストアクション（目的：${SNS_GOAL_CONFIG[p.goal].label}）

${actions.join('\n')}

▶ 実行の優先順位：
・まず「□ プロフィール整備」から着手（全投稿の入口になるため最優先）
・次に「□ 投稿素材の準備」（内容なしには戦略も動かない）
・最後に「□ 投稿・CTA設置」の実行へ
・1週間後に投稿数・エンゲージメント・プロフィールアクセスを確認して次の調整を行う`
}

// ─── メイン生成関数 ───────────────────────────────────────

export function generateSnsSections(params: GenParams): {
  sections: SnsStrategySection[]
  weeklyPostCount: number
  primaryCta: string
  marketingPhaseLink: MarketingPhaseLink
} {
  const weeklyPostCount = calcWeeklyPostCount(params.platforms, params.goal)
  const goalCfg = SNS_GOAL_CONFIG[params.goal]

  const rawContents: Record<string, string> = {
    platform_policy: genPlatformPolicy(params),
    post_themes:     genPostThemes(params),
    key_strengths:   genKeyStrengths(params),
    post_flow:       genPostFlow(params),
    conversion_cta:  genConversionCta(params),
    weekly_plan:     genWeeklyPlan(params),
    avoid_content:   genAvoidContent(params),
    next_actions:    genNextActions(params),
  }

  const sections: SnsStrategySection[] = SNS_SECTION_KEYS.map((key) => ({
    key,
    label: SNS_SECTION_META[key].label,
    hint:  SNS_SECTION_META[key].hint,
    content: rawContents[key] ?? '',
  }))

  return {
    sections,
    weeklyPostCount,
    primaryCta: goalCfg.defaultCta,
    marketingPhaseLink: goalCfg.phase,
  }
}
