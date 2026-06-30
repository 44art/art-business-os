import type {
  Brand, Artwork, Workshop, Persona,
  ContentDraft, LandingPageDraft, LineStrategyDraft, SnsStrategyDraft,
} from '@/types'
import {
  getBrand, saveBrand,
  getArtworks, saveArtwork,
  getWorkshops, saveWorkshop,
  getPersonas, savePersona,
  getContentDrafts, saveContentDraft,
  getLpDrafts, saveLpDraft,
  getLineDrafts, saveLineDraft,
  getSnsDrafts, saveSnsDraft,
  getConsultantReports, saveConsultantReport,
} from '@/lib/storage'
import { generateContentDraft } from '@/lib/content'
import { generateLpSections, LP_GOAL_CONFIG } from '@/lib/lp'
import { generateLineSections, LINE_GOAL_CONFIG } from '@/lib/line'
import { generateSnsSections, SNS_GOAL_CONFIG } from '@/lib/sns'
import { generateConsultantReport } from '@/lib/consultant'

// ─── 定数 ────────────────────────────────────────────────

const SAMPLE_LOADED_KEY = 'abo_sample_loaded'

function makeId(prefix: string): string {
  return `${prefix}_sample_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

// ─── 型定義 ──────────────────────────────────────────────

export type SampleLoadResult = {
  brandAdded: boolean
  artworksAdded: number
  workshopsAdded: number
  personasAdded: number
}

export type SampleAllResult = SampleLoadResult & {
  contentsAdded: number
  lpAdded: number
  lineAdded: number
  snsAdded: number
  consultantAdded: boolean
}

// ─── ヘルパー ─────────────────────────────────────────────

export function isSampleLoaded(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(SAMPLE_LOADED_KEY) === '1'
}

export function clearSampleFlag(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SAMPLE_LOADED_KEY)
}

// ─── ブランド・作品・WS・ペルソナのサンプルデータ ─────────

/**
 * ブランド・作品・WS・ペルソナのサンプルデータを追加する。
 * 既に存在する場合はスキップ（上書きしない）。
 */
export function loadSampleData(): SampleLoadResult {
  const now = new Date().toISOString()
  const result: SampleLoadResult = {
    brandAdded: false,
    artworksAdded: 0,
    workshopsAdded: 0,
    personasAdded: 0,
  }

  // ─── ブランド ───────────────────────────────────────────
  if (!getBrand()) {
    const brand: Brand = {
      id: makeId('brand'),
      name: 'KEN ART WORKS',
      activities:
        'スニーカーのカスタムペイントと箔画・抽象画の原画制作を行っています。' +
        '月1〜2回のスニーカーペイント体験ワークショップも定期開催しています。',
      products:
        'スニーカーカスタム（1足35,000円〜）、箔画原画（50,000円〜）、' +
        '抽象画原画（30,000円〜）、スニーカーペイント体験WS（5,500円/人）',
      strengths:
        '10年以上のカスタム経験。実際に履けるクオリティにこだわった耐久性。' +
        '箔と絵の具を組み合わせた独自技法。作家本人との1対1の制作相談対応。',
      targetCustomer:
        'スニーカー好きの20〜40代男女。アート好きのインテリア派。' +
        'ギフト・記念品を探している人。体験型の趣味を求めている人。',
      priceRange: 'WS 5,500円〜、作品 30,000円〜、カスタム 35,000円〜',
      salesChannel: 'Instagram → プロフィールリンク → LINE公式 → DM受付 → Stripe決済',
      updatedAt: now,
    }
    saveBrand(brand)
    result.brandAdded = true
  }

  // ─── 作品 ───────────────────────────────────────────────
  if (getArtworks().length === 0) {
    const artwork1: Artwork = {
      id: makeId('artwork'),
      title: '赤と金の抽象カスタムスニーカー',
      genre: 'スニーカーペイント',
      concept:
        '「捨てられるはずだった一足を、世界でひとつの作品に」をテーマに制作。' +
        '赤の情熱と金の輝きで、履く人の個性を引き出します。' +
        '日常に溶け込む芸術として、見る人・履く人の心に残る一足を目指しました。',
      features:
        'アクリル絵の具＋箔使いのコラボレーション。専用コーティングで耐久性を確保し実際に履けます。' +
        'Air Force 1ベース。W27.0cm（サイズオーダー可）。',
      targetCustomer:
        'スニーカー好きの30代男性。唯一無二のアイテムで自分らしさを表現したい人。' +
        'プレゼント・記念品として特別な一足を探している人。',
      price: 45000,
      status: 'selling',
      createdAt: now,
      updatedAt: now,
    }

    const artwork2: Artwork = {
      id: makeId('artwork'),
      title: '箔画「金色の風」',
      genre: '箔画',
      concept:
        '金箔と銀箔を重ねた抽象表現。和と現代アートの融合をテーマに、' +
        '見る角度や光の当たり方で表情が変わる一点物作品。' +
        'リビングや玄関に飾ると空間全体に上質な輝きをもたらします。',
      features:
        '純金箔・純銀箔を手作業で貼り込み。岩絵具と箔の組み合わせで生み出す独自のテクスチャー。' +
        'W60×H80cm木製パネル。壁掛け用フック付き。',
      targetCustomer:
        'アート好きのインテリア派（30〜50代）。新居・リノベーションでこだわりの空間を作りたい人。' +
        '法人ギフト・開店祝いを探している人。',
      price: 65000,
      status: 'selling',
      createdAt: now,
      updatedAt: now,
    }

    saveArtwork(artwork1)
    saveArtwork(artwork2)
    result.artworksAdded = 2
  }

  // ─── ワークショップ ──────────────────────────────────────
  if (getWorkshops().length === 0) {
    const workshop: Workshop = {
      id: makeId('ws'),
      title: 'スニーカーペイント体験ワークショップ',
      description:
        '自分だけのオリジナルスニーカーをペイントする2時間の体験ワークショップ。' +
        'デザインの考え方から実際のペイント、仕上げのコーティングまでを丁寧にサポートします。' +
        '初心者でも安心。好きな色・絵柄で世界に1足だけの作品を作りましょう。' +
        '材料・道具はすべて用意します。',
      targetAudience:
        '初心者歓迎。中学生以上。カップル・友達・親子での参加OK。' +
        'スニーカーはご自身でご用意いただくか、会場の素材を使用（追加費用あり）。',
      format: 'in-person',
      price: 5500,
      duration: '2時間',
      salesChannel:
        'Instagram → プロフィールリンク → Googleフォーム申込 → LINE公式で詳細案内',
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }
    saveWorkshop(workshop)
    result.workshopsAdded = 1
  }

  // ─── ペルソナ（追加後のデータを参照） ─────────────────────
  if (getPersonas().length === 0) {
    const artworks = getArtworks()
    const workshops = getWorkshops()

    if (artworks.length > 0) {
      const artwork = artworks[0]
      const persona1: Persona = {
        id: makeId('persona'),
        sourceType: 'artwork',
        sourceId: artwork.id,
        sourceName: artwork.title,
        name: '30代スニーカーコレクター・Kさん',
        age: '30〜38歳',
        gender: '男性',
        occupation: '会社員（営業・IT系）',
        pains: [
          '市販のスニーカーでは「自分らしさ」が出せない',
          '欲しいコラボモデルはすぐ完売してしまう',
          'プレゼントに何を選べばいいか毎回迷う',
        ],
        desires: [
          '世界に1足だけの、自分を表現できるスニーカーを持ちたい',
          '作家との会話や制作ストーリーを含めた体験として購入したい',
          '友人・パートナーに「センスがいい」と思われたい',
        ],
        purchaseReason: '一点物のストーリーと作家の熱量に共感し、唯一無二の価値を感じたから',
        purchaseAnxiety:
          '価格が高く本当に自分に合うか不安\n実物を見ずに購入するのが心配\nアフターケアの方法が分からない',
        resonantPhrases: [
          'あなただけの一足',
          '量産品では出せない、作家の温度感',
          '10年後も「これがいい」と思える一足を',
        ],
        usedChannels: ['Instagram', 'X'],
        salesChannelFit: 'Instagram → LP（作品詳細） → DM問い合わせ → Stripe決済',
        createdAt: now,
        updatedAt: now,
      }
      savePersona(persona1)
      result.personasAdded++
    }

    if (workshops.length > 0) {
      const workshop = workshops[0]
      const persona2: Persona = {
        id: makeId('persona'),
        sourceType: 'workshop',
        sourceId: workshop.id,
        sourceName: workshop.title,
        name: '20代体験好き女性・Mさん',
        age: '22〜29歳',
        gender: '女性',
        occupation: '会社員・OL / 副業・フリーランス志望',
        pains: [
          '休日の趣味が定まっておらず「何かを作る」経験が少ない',
          '友達と行ける非日常体験を探している',
          'SNSに映える体験・モノを求めている',
        ],
        desires: [
          '自分で作った世界に一つのものを持ちたい・プレゼントしたい',
          '作家と直接話せる特別な時間を体験したい',
          'SNSで「こんなの作ったよ」とシェアできる体験がしたい',
        ],
        purchaseReason: '初心者でも完成できる気軽さと、達成感のある体験に興味を持ったから',
        purchaseAnxiety:
          '絵心がなくてもできるか不安\n2時間で仕上がるか心配\n材料・道具の準備が面倒そう',
        resonantPhrases: [
          '初心者でも必ず完成する',
          '2時間で世界に1足を作れます',
          '絵心ゼロでも大丈夫！全部サポートします',
        ],
        usedChannels: ['Instagram', 'TikTok', 'LINE'],
        salesChannelFit:
          'Instagram / TikTok → プロフィールリンク → 申込フォーム → LINE公式で確認メッセージ',
        createdAt: now,
        updatedAt: now,
      }
      savePersona(persona2)
      result.personasAdded++
    }
  }

  return result
}

// ─── 生成結果まで含む全サンプルを追加 ─────────────────────

/**
 * ブランド・作品・WS・ペルソナに加えて、
 * コンテンツ・LP・LINE・SNS・コンサルタントのサンプル生成結果を追加する。
 * 既に存在するカテゴリはスキップ（上書きしない）。
 */
export function loadAllSamples(): SampleAllResult {
  const base = loadSampleData()
  const now = new Date().toISOString()

  const result: SampleAllResult = {
    ...base,
    contentsAdded: 0,
    lpAdded: 0,
    lineAdded: 0,
    snsAdded: 0,
    consultantAdded: false,
  }

  const artworks = getArtworks()
  const workshops = getWorkshops()
  const personas = getPersonas()

  if (artworks.length === 0 || personas.length === 0) return result

  const artwork1 = artworks[0]
  const workshop1 = workshops[0] ?? null
  const persona1 = personas.find((p) => p.sourceType === 'artwork') ?? personas[0]
  const persona2 = personas.find((p) => p.sourceType === 'workshop') ?? personas[0]

  // ─── コンテンツ ─────────────────────────────────────────
  const savedContents: ContentDraft[] = []

  if (getContentDrafts().length === 0) {
    const contentDefs: Array<{
      contentType: Parameters<typeof generateContentDraft>[0]['contentType']
      persona: Persona
      source: Brand | Artwork | Workshop | null
      sourceType: 'brand' | 'artwork' | 'workshop'
      sourceId: string
      sourceName: string
    }> = [
      {
        contentType: 'sns_post',
        persona: persona1,
        source: artwork1,
        sourceType: 'artwork',
        sourceId: artwork1.id,
        sourceName: artwork1.title,
      },
      ...(workshop1 && persona2
        ? [{
            contentType: 'ws_announce' as const,
            persona: persona2,
            source: workshop1,
            sourceType: 'workshop' as const,
            sourceId: workshop1.id,
            sourceName: workshop1.title,
          }]
        : []),
      {
        contentType: 'artwork_sales',
        persona: persona1,
        source: artwork1,
        sourceType: 'artwork',
        sourceId: artwork1.id,
        sourceName: artwork1.title,
      },
      {
        contentType: 'lp_intro',
        persona: persona1,
        source: artwork1,
        sourceType: 'artwork',
        sourceId: artwork1.id,
        sourceName: artwork1.title,
      },
      ...(workshop1 && persona2
        ? [{
            contentType: 'line_message' as const,
            persona: persona2,
            source: workshop1,
            sourceType: 'workshop' as const,
            sourceId: workshop1.id,
            sourceName: workshop1.title,
          }]
        : []),
    ]

    for (const def of contentDefs) {
      const out = generateContentDraft({ contentType: def.contentType, persona: def.persona, source: def.source })
      const draft: ContentDraft = {
        id: makeId('content'),
        personaId: def.persona.id,
        personaName: def.persona.name,
        sourceType: def.sourceType,
        sourceId: def.sourceId,
        sourceName: def.sourceName,
        ...out,
        status: 'saved',
        generatedAt: now,
        updatedAt: now,
      }
      saveContentDraft(draft)
      savedContents.push(draft)
      result.contentsAdded++
    }
  } else {
    savedContents.push(...getContentDrafts().slice(0, 5))
  }

  // ─── LP ─────────────────────────────────────────────────
  const savedLp: LandingPageDraft[] = []

  if (getLpDrafts().length === 0) {
    const refContent = savedContents.find((c) => c.contentType === 'lp_intro') ?? savedContents[0] ?? null
    const lpResult = generateLpSections({
      goal: 'artwork_sales',
      persona: persona1,
      source: artwork1,
      referencedContent: refContent,
    })
    const lpDraft: LandingPageDraft = {
      id: makeId('lp'),
      personaId: persona1.id,
      personaName: persona1.name,
      sourceType: 'artwork',
      sourceId: artwork1.id,
      sourceName: artwork1.title,
      referencedContentId: refContent?.id,
      referencedContentName: refContent ? 'LP導入文' : undefined,
      goal: 'artwork_sales',
      goalLabel: LP_GOAL_CONFIG.artwork_sales.label,
      sections: lpResult.sections,
      lineCtaText: lpResult.lineCtaText,
      lineRegistrationUrl: '',
      status: 'saved',
      generatedAt: now,
      updatedAt: now,
    }
    saveLpDraft(lpDraft)
    savedLp.push(lpDraft)
    result.lpAdded++
  } else {
    savedLp.push(...getLpDrafts().slice(0, 1))
  }

  // ─── LINE ────────────────────────────────────────────────
  const savedLine: LineStrategyDraft[] = []

  if (getLineDrafts().length === 0 && workshop1 && persona2) {
    const wsAnnounce = savedContents.find((c) => c.contentType === 'ws_announce') ?? null
    const lineResult = generateLineSections({
      goal: 'ws_booking',
      persona: persona2,
      source: workshop1,
      referencedContent: wsAnnounce,
      referencedLp: null,
    })
    const lineDraft: LineStrategyDraft = {
      id: makeId('line'),
      personaId: persona2.id,
      personaName: persona2.name,
      sourceType: 'workshop',
      sourceId: workshop1.id,
      sourceName: workshop1.title,
      referencedContentId: wsAnnounce?.id,
      referencedContentName: wsAnnounce ? 'WS告知文' : undefined,
      goal: 'ws_booking',
      goalLabel: LINE_GOAL_CONFIG.ws_booking.label,
      lineRegistrationUrl: '',
      sections: lineResult.sections,
      recommendedChannels: lineResult.recommendedChannels,
      snsCtaText: lineResult.snsCtaText,
      status: 'saved',
      generatedAt: now,
      updatedAt: now,
    }
    saveLineDraft(lineDraft)
    savedLine.push(lineDraft)
    result.lineAdded++
  } else {
    savedLine.push(...getLineDrafts().slice(0, 1))
  }

  // ─── SNS ─────────────────────────────────────────────────
  const savedSns: SnsStrategyDraft[] = []

  if (getSnsDrafts().length === 0) {
    const snsResult = generateSnsSections({
      goal: 'awareness',
      platforms: ['instagram', 'x'],
      persona: persona1,
      source: artwork1,
      referencedContent: savedContents.find((c) => c.contentType === 'sns_post') ?? null,
      referencedLp: savedLp[0] ?? null,
      referencedLine: savedLine[0] ?? null,
    })
    const snsDraft: SnsStrategyDraft = {
      id: makeId('sns'),
      personaId: persona1.id,
      personaName: persona1.name,
      sourceType: 'artwork',
      sourceId: artwork1.id,
      sourceName: artwork1.title,
      referencedContentName: 'SNS投稿文',
      referencedLpName: savedLp[0] ? LP_GOAL_CONFIG.artwork_sales.label : undefined,
      goal: 'awareness',
      goalLabel: SNS_GOAL_CONFIG.awareness.label,
      platforms: ['instagram', 'x'],
      sections: snsResult.sections,
      marketingPhaseLink: snsResult.marketingPhaseLink,
      weeklyPostCount: snsResult.weeklyPostCount,
      primaryCta: snsResult.primaryCta,
      status: 'saved',
      generatedAt: now,
      updatedAt: now,
    }
    saveSnsDraft(snsDraft)
    savedSns.push(snsDraft)
    result.snsAdded++
  } else {
    savedSns.push(...getSnsDrafts().slice(0, 1))
  }

  // ─── AIコンサルタント ────────────────────────────────────
  if (getConsultantReports().length === 0) {
    const allContents = getContentDrafts()
    const allLp = getLpDrafts()
    const allLine = getLineDrafts()
    const allSns = getSnsDrafts()

    const report = generateConsultantReport({
      sourceType: 'artwork',
      sourceId: artwork1.id,
      sourceName: artwork1.title,
      source: artwork1,
      personas,
      contentDrafts: allContents,
      lpDrafts: allLp,
      lineDrafts: allLine,
      snsDrafts: allSns,
    })
    report.status = 'saved'
    report.personaIds = personas.map((p) => p.id)
    report.personaNames = personas.map((p) => p.name)
    report.relatedDataSummary = {
      content: allContents.length,
      lp: allLp.length,
      line: allLine.length,
      sns: allSns.length,
    }
    saveConsultantReport(report)
    result.consultantAdded = true
  }

  // ─── ロード済みフラグ ─────────────────────────────────────
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAMPLE_LOADED_KEY, '1')
  }

  return result
}
