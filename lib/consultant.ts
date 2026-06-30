import type {
  Brand,
  Artwork,
  Workshop,
  Persona,
  ContentDraft,
  LandingPageDraft,
  LineStrategyDraft,
  SnsStrategyDraft,
  ConsultantPhaseItem,
  ConsultantReport,
  MarketingPhaseLink,
} from '@/types'

// ─── 入力型 ───────────────────────────────────────────────

type Source = Brand | Artwork | Workshop

export type DiagnosticInput = {
  sourceType: 'brand' | 'artwork' | 'workshop'
  sourceId: string
  sourceName: string
  source: Source
  personas: Persona[]
  contentDrafts: ContentDraft[]
  lpDrafts: LandingPageDraft[]
  lineDrafts: LineStrategyDraft[]
  snsDrafts: SnsStrategyDraft[]
}

// ─── ユーティリティ ───────────────────────────────────────

function forPersonas<T extends { personaId: string }>(
  items: T[],
  personaIds: string[]
): T[] {
  return items.filter((x) => personaIds.includes(x.personaId))
}

// ─── フェーズ別診断 ───────────────────────────────────────

function diagnoseAwareness(
  inp: DiagnosticInput,
  personaIds: string[]
): ConsultantPhaseItem {
  const snsAwareness = forPersonas(inp.snsDrafts, personaIds).filter(
    (s) => s.goal === 'awareness' || s.goal === 'fan'
  )
  const snsContent = forPersonas(inp.contentDrafts, personaIds).filter(
    (c) => c.contentType === 'sns_post'
  )
  const hasPersona = inp.personas.length > 0
  const hasSnsStrategy = snsAwareness.length > 0
  const hasSnsContent = snsContent.length > 0
  const hasMultiplePlatforms = snsAwareness.some((s) => s.platforms.length >= 2)

  const done: string[] = []
  const missing: string[] = []
  const improvements: string[] = []
  const nextActions: string[] = []

  // done
  if (hasPersona) done.push(`ペルソナを ${inp.personas.length} 件定義済み（誰に届けるかが明確）`)
  if (hasSnsContent) done.push(`SNS投稿コンテンツ案が ${snsContent.length} 件作成済み`)
  if (hasSnsStrategy) done.push(
    `認知拡大・ファン化向けSNS戦略が ${snsAwareness.length} 件作成済み（媒体: ${
      [...new Set(snsAwareness.flatMap((s) => s.platforms))].join('・') || '未設定'
    }）`
  )
  if (hasMultiplePlatforms) done.push('複数SNS媒体を組み合わせた発信計画がある')

  // missing
  if (!hasPersona) missing.push('ペルソナが未作成（誰に届けるか不明確）')
  if (!hasSnsContent) missing.push('SNS投稿の文章案が未作成')
  if (!hasSnsStrategy) missing.push('SNS認知拡大戦略が未作成')
  if (hasSnsStrategy && !hasMultiplePlatforms) {
    missing.push('SNS発信が1媒体のみ（リーチが限定的）')
  }
  if (inp.personas.length > 0 && inp.personas[0].usedChannels.length === 0) {
    missing.push('ペルソナのSNSチャネルが未設定')
  }

  // improvements
  if (!hasSnsStrategy) {
    improvements.push(`SNS戦略画面で「認知拡大」目的の戦略を1件作成する`)
  }
  if (hasSnsStrategy && !hasSnsContent) {
    improvements.push('作成済みSNS戦略をもとにコンテンツ生成画面でSNS投稿案を作成する')
  }
  if (hasPersona && inp.personas[0].resonantPhrases.length > 0) {
    improvements.push(
      `ペルソナに刺さるキーワード「${inp.personas[0].resonantPhrases[0]}」をSNS投稿に必ず盛り込む`
    )
  }
  improvements.push('週間投稿スケジュールを固定して継続的に発信する体制を作る')

  // nextActions (今すぐ → 次に整える → 後で検討)
  if (!hasPersona) nextActions.push('[今すぐ] ペルソナ作成で顧客像を1件定義する')
  if (!hasSnsContent) nextActions.push('[今すぐ] コンテンツ生成で「SNS投稿文」を1件作成して今週から投稿する')
  if (!hasSnsStrategy) nextActions.push('[次に整える] SNS戦略で「認知拡大」目的の戦略案を1件生成する')
  nextActions.push('[次に整える] 全SNS媒体のプロフィール文・プロフィールリンクを統一して整備する')
  nextActions.push('[後で検討] 投稿の反応（いいね・保存・プロフィールアクセス）を週次で計測する仕組みを作る')

  return {
    phase: 'awareness',
    phaseLabel: '認知',
    done: done.length > 0 ? done : ['まだ認知フェーズの施策が開始されていません'],
    missing,
    improvements,
    nextActions,
  }
}

function diagnoseAcquisition(
  inp: DiagnosticInput,
  personaIds: string[]
): ConsultantPhaseItem {
  const lpDrafts = forPersonas(inp.lpDrafts, personaIds)
  const lineDrafts = forPersonas(inp.lineDrafts, personaIds)
  const snsAcquisition = forPersonas(inp.snsDrafts, personaIds).filter(
    (s) => s.goal === 'ws_booking' || s.goal === 'line_register'
  )
  const wsAnnounce = forPersonas(inp.contentDrafts, personaIds).filter(
    (c) => c.contentType === 'ws_announce'
  )
  const lpForWs = lpDrafts.filter((l) => l.goal === 'ws_booking')
  const lpForLine = lpDrafts.filter((l) => l.goal === 'line_register')
  const hasLine = lineDrafts.length > 0
  const hasLineUrl = lineDrafts.some((l) => l.lineRegistrationUrl)
  const hasLp = lpDrafts.length > 0
  const hasWsContent = wsAnnounce.length > 0
  const hasSnsAcquisition = snsAcquisition.length > 0

  // ワークショップ有無
  const isWs = inp.sourceType === 'workshop'

  const done: string[] = []
  const missing: string[] = []
  const improvements: string[] = []
  const nextActions: string[] = []

  if (hasLp) done.push(`LP案が ${lpDrafts.length} 件作成済み（目的: ${[...new Set(lpDrafts.map((l) => l.goalLabel))].join('・')}）`)
  if (hasLine) done.push(`LINE活用戦略が ${lineDrafts.length} 件作成済み`)
  if (hasLineUrl) done.push('LINE登録URLが設定済み（集客導線が具体化されている）')
  if (hasWsContent) done.push(`WS告知文が ${wsAnnounce.length} 件作成済み`)
  if (hasSnsAcquisition) done.push('SNS集客・LINE登録促進の戦略案がある')
  if (lpForWs.length > 0) done.push('WS予約用LPの構成案がある')
  if (lpForLine.length > 0) done.push('LINE登録誘導用LPの構成案がある')

  if (!hasLp) missing.push('LP（ランディングページ）案が未作成（集客の受け皿がない）')
  if (!hasLine) missing.push('LINE活用戦略が未作成（リスト獲得の仕組みがない）')
  if (!hasLineUrl) missing.push('LINE登録URLが未設定（実際の登録誘導ができない）')
  if (isWs && !hasWsContent) missing.push('WS告知文が未作成（申し込み促進テキストがない）')
  if (!hasSnsAcquisition) missing.push('SNSからの集客戦略が未作成')

  if (!hasLp) {
    improvements.push('LP作成支援画面でWS予約 or LINE登録用のLPを1件作成する')
  }
  if (!hasLine) {
    improvements.push('LINE活用支援画面でLINE戦略を1件作成する')
  }
  if (hasLine && !hasLineUrl) {
    improvements.push('LINE活用支援画面でLINE登録URLを入力・保存する')
  }
  if (hasLp && hasLine) {
    improvements.push('LP案とLINE戦略を連携させて「LP→LINE登録」の導線を整備する')
  }
  improvements.push('SNS投稿の末尾に必ずLP/LINEへの誘導CTAを入れる')

  nextActions.push(hasLp
    ? '[今すぐ] LP案を参照してSNSプロフィールのリンクを設定する'
    : '[今すぐ] LP作成支援で集客LPの構成案を1件生成する')
  nextActions.push(hasLine
    ? '[今すぐ] LINE登録URLをLP・SNSプロフィールの全媒体に設置する'
    : '[次に整える] LINE活用支援でLINEシナリオを1件生成する')
  if (isWs && !hasWsContent) nextActions.push('[今すぐ] コンテンツ生成でWS告知文を作成してSNSに投稿する')
  nextActions.push('[次に整える] SNS投稿に「LINEで先行案内中↓」CTA文を追加して毎週1回誘導投稿を出す')

  return {
    phase: 'acquisition',
    phaseLabel: '集客',
    done: done.length > 0 ? done : ['まだ集客フェーズの施策が開始されていません'],
    missing,
    improvements,
    nextActions,
  }
}

function diagnoseSales(
  inp: DiagnosticInput,
  personaIds: string[]
): ConsultantPhaseItem {
  const lpSales = forPersonas(inp.lpDrafts, personaIds).filter(
    (l) => l.goal === 'artwork_sales' || l.goal === 'ws_booking' || l.goal === 'inquiry'
  )
  const salesContent = forPersonas(inp.contentDrafts, personaIds).filter(
    (c) => c.contentType === 'artwork_sales' || c.contentType === 'ws_announce' || c.contentType === 'lp_intro'
  )
  const snsSales = forPersonas(inp.snsDrafts, personaIds).filter(
    (s) => s.goal === 'artwork_sales' || s.goal === 'ws_booking'
  )
  const lineSales = forPersonas(inp.lineDrafts, personaIds).filter(
    (l) => l.goal === 'artwork_sales' || l.goal === 'ws_booking' || l.goal === 'inquiry'
  )

  // 価格設定チェック
  const hasPrice = inp.sourceType === 'artwork'
    ? ('price' in inp.source && (inp.source as Artwork).price !== undefined && (inp.source as Artwork).price! > 0)
    : inp.sourceType === 'workshop'
    ? ('price' in inp.source && (inp.source as Workshop).price > 0)
    : true // brandは価格チェック不要

  const done: string[] = []
  const missing: string[] = []
  const improvements: string[] = []
  const nextActions: string[] = []

  if (hasPrice && inp.sourceType !== 'brand') done.push('価格が設定済み（購入判断の基準が明確）')
  if (lpSales.length > 0) done.push(`販売用LP案が ${lpSales.length} 件作成済み（目的: ${[...new Set(lpSales.map((l) => l.goalLabel))].join('・')}）`)
  if (salesContent.length > 0) done.push(`販売促進コンテンツが ${salesContent.length} 件作成済み`)
  if (snsSales.length > 0) done.push('SNS販売促進戦略が作成済み')
  if (lineSales.length > 0) done.push('LINE経由の販売戦略が作成済み')

  if (!hasPrice && inp.sourceType !== 'brand') missing.push('価格が未設定（購入意欲があっても決済に進めない）')
  if (lpSales.length === 0) missing.push('販売用LP（作品販売/WS予約/問い合わせ）が未作成')
  if (salesContent.length === 0) missing.push('作品・WSの販売促進コンテンツが未作成')
  if (snsSales.length === 0) missing.push('SNSからの直接販売誘導戦略がない')
  if (inp.personas.length > 0 && inp.personas[0].purchaseAnxiety) {
    missing.push(`ペルソナの購入不安「${inp.personas[0].purchaseAnxiety.slice(0, 30)}…」への対処が不足している可能性`)
  }

  if (lpSales.length === 0) {
    improvements.push('LP作成支援で「作品販売」or「WS予約」目的のLPを1件作成する')
  }
  if (salesContent.length === 0) {
    improvements.push('コンテンツ生成で「作品販売文」または「LP導入文」を作成する')
  }
  if (lpSales.length > 0 && snsSales.length === 0) {
    improvements.push('SNS戦略で「作品販売」目的の戦略を作成してSNS→LPの導線を強化する')
  }
  if (inp.personas.length > 0 && inp.personas[0].purchaseAnxiety) {
    improvements.push(
      `LP・SNSコンテンツの中で購入不安「${inp.personas[0].purchaseAnxiety.slice(0, 25)}…」を解消するFAQや実績紹介を追加する`
    )
  }
  improvements.push('販売ページのCTAテキストをペルソナに刺さる言葉に合わせて調整する')

  nextActions.push(lpSales.length === 0
    ? '[今すぐ] LP作成支援で販売・予約LP案を1件生成する'
    : '[今すぐ] 作成済みLP案をもとに実際のLPページを公開・リンク設定する')
  nextActions.push(salesContent.length === 0
    ? '[今すぐ] コンテンツ生成で販売文または作品紹介文を1件作成する'
    : '[今すぐ] 作成済み販売文をSNS・LP・LINEで実際に活用する')
  nextActions.push('[次に整える] 購入・申し込みまでのステップを3ステップ以内に簡略化する')
  nextActions.push('[後で検討] 購入者・参加者の感想を集めて社会的証明（口コミ）として活用する')

  return {
    phase: 'sales',
    phaseLabel: '販売',
    done: done.length > 0 ? done : ['まだ販売フェーズの施策が開始されていません'],
    missing,
    improvements,
    nextActions,
  }
}

function diagnoseRetention(
  inp: DiagnosticInput,
  personaIds: string[]
): ConsultantPhaseItem {
  const lineRetention = forPersonas(inp.lineDrafts, personaIds).filter(
    (l) => l.goal === 'repeat' || l.goal === 'fan'
  )
  const lineContent = forPersonas(inp.contentDrafts, personaIds).filter(
    (c) => c.contentType === 'line_message'
  )
  const snsRetention = forPersonas(inp.snsDrafts, personaIds).filter(
    (s) => s.goal === 'fan' || s.goal === 'repeat'
  )
  const allLineDrafts = forPersonas(inp.lineDrafts, personaIds)
  const hasLineUrl = allLineDrafts.some((l) => l.lineRegistrationUrl)
  const hasStepDelivery = allLineDrafts.some(
    (l) => l.sections.some((s) => s.key === 'message_1' && s.content.length > 20)
  )

  const done: string[] = []
  const missing: string[] = []
  const improvements: string[] = []
  const nextActions: string[] = []

  if (lineRetention.length > 0) done.push(`リピーター・ファン化向けLINE戦略が ${lineRetention.length} 件作成済み`)
  if (lineContent.length > 0) done.push(`LINE配信文が ${lineContent.length} 件作成済み`)
  if (snsRetention.length > 0) done.push('SNSでのファン化・リピーター化戦略がある')
  if (hasLineUrl) done.push('LINE登録URLが設定済み（リピーター化の入口がある）')
  if (hasStepDelivery) done.push('LINEステップ配信の配信文が作成済み')

  if (lineRetention.length === 0) missing.push('リピーター・ファン向けLINE戦略が未作成')
  if (lineContent.length === 0) missing.push('LINE配信文が未作成（リピーター化の自動化ができない）')
  if (snsRetention.length === 0) missing.push('SNSでのファン化施策が未作成（長期関係構築が弱い）')
  if (!hasLineUrl) missing.push('LINE登録URLが未設定（既存顧客の囲い込みができない）')
  if (!hasStepDelivery) missing.push('LINEステップ配信の内容が不十分（購入後のフォローができない）')

  if (lineRetention.length === 0) {
    improvements.push('LINE活用支援で「リピーター化」または「ファン化」目的の戦略を1件作成する')
  }
  if (lineContent.length === 0) {
    improvements.push('コンテンツ生成で「LINE配信文」を作成して既存顧客への定期発信を準備する')
  }
  improvements.push('購入者・WS参加者には次回案内を必ずLINEで送る仕組みを作る')
  improvements.push('SNSのファン向け投稿（制作日記・制作秘話）を週1〜2回継続して信頼を蓄積する')
  improvements.push('年間イベント（クリスマス・年末など）に合わせた先行案内メッセージを事前に作成する')

  nextActions.push(lineRetention.length === 0
    ? '[今すぐ] LINE活用支援で「リピーター化」または「ファン化」目的の戦略を1件生成する'
    : '[今すぐ] 作成済みLINE戦略をLINE公式アカウントのシナリオに設定する')
  nextActions.push(lineContent.length === 0
    ? '[今すぐ] コンテンツ生成でLINE配信文（お礼・次回案内）を1件作成する'
    : '[次に整える] 作成済みLINE配信文をLINE公式アカウントに登録する')
  nextActions.push('[次に整える] 全購入者・WS参加者にLINE登録を案内するフロー（当日・翌日）を決める')
  nextActions.push('[後で検討] 月1〜2回のLINE配信スケジュールをカレンダーに固定する')

  return {
    phase: 'retention',
    phaseLabel: 'リピーター化',
    done: done.length > 0 ? done : ['まだリピーター化フェーズの施策が開始されていません'],
    missing,
    improvements,
    nextActions,
  }
}

// ─── 全体診断 ─────────────────────────────────────────────

function diagnoseOverall(
  inp: DiagnosticInput,
  phases: ConsultantPhaseItem[]
): {
  topPriority: string
  quickWin: string
  activeFlows: string[]
  weakFlows: string[]
  contentIdeas: string[]
} {
  const missingCounts = phases.map((p) => ({ phase: p.phase, count: p.missing.length }))
  const weakestPhase = missingCounts.reduce((a, b) => (a.count > b.count ? a : b))

  const personaIds = inp.personas.map((p) => p.id)
  const allContent = forPersonas(inp.contentDrafts, personaIds)
  const allLp = forPersonas(inp.lpDrafts, personaIds)
  const allLine = forPersonas(inp.lineDrafts, personaIds)
  const allSns = forPersonas(inp.snsDrafts, personaIds)

  // 今すぐ使える導線
  const activeFlows: string[] = []
  if (allSns.some((s) => s.goal === 'awareness')) activeFlows.push('SNS認知拡大戦略 → SNS投稿 → フォロワー獲得')
  if (allLp.length > 0 && allLine.some((l) => l.lineRegistrationUrl)) {
    activeFlows.push('LP案 → LINE登録URL → ステップ配信')
  }
  if (allContent.some((c) => c.contentType === 'ws_announce') && allLp.some((l) => l.goal === 'ws_booking')) {
    activeFlows.push('WS告知コンテンツ → WS予約LP → 申し込み')
  }
  if (allContent.some((c) => c.contentType === 'artwork_sales') && allLp.some((l) => l.goal === 'artwork_sales')) {
    activeFlows.push('作品販売コンテンツ → 作品販売LP → 購入')
  }
  if (allLine.some((l) => l.goal === 'repeat' || l.goal === 'fan')) {
    activeFlows.push('LINE戦略 → ステップ配信 → リピート購入')
  }
  if (activeFlows.length === 0) activeFlows.push('まだ完成した導線がありません。先にペルソナ→コンテンツ→LPの順で作成してください')

  // まだ弱い導線
  const weakFlows: string[] = []
  if (!allSns.some((s) => s.goal === 'awareness')) weakFlows.push('SNSでの認知拡大（戦略案未作成）')
  if (!allLine.some((l) => l.lineRegistrationUrl)) weakFlows.push('LINE登録への誘導（URL未設定）')
  if (!allLp.some((l) => l.goal === 'artwork_sales' || l.goal === 'ws_booking')) weakFlows.push('販売・予約LPへの直接誘導')
  if (!allLine.some((l) => l.goal === 'repeat')) weakFlows.push('購入後のリピーター化フロー')
  if (!allSns.some((s) => s.goal === 'line_register')) weakFlows.push('SNSからLINE登録への橋渡し')

  // 最優先改善ポイント
  const phaseLabels: Record<string, string> = { awareness: '認知', acquisition: '集客', sales: '販売', retention: 'リピーター化' }
  const weakPhase = phases.find((p) => p.phase === weakestPhase.phase)
  const topPriority = [
    `【最優先：${phaseLabels[weakestPhase.phase] ?? '全体'}フェーズの強化】`,
    '',
    `▼ 問題点`,
    weakPhase?.missing[0] ?? '各フェーズの施策を順番に整備してください',
    '',
    `▼ 今すぐやること`,
    weakPhase?.improvements[0] ?? '次のアクション項目を実行してください',
    '',
    `▼ 次に整えること`,
    weakPhase?.improvements[1] ?? weakPhase?.nextActions[0] ?? '各フェーズの詳細アクションを確認してください',
    '',
    `▼ 後で検討すること`,
    weakPhase?.improvements[2] ?? '効果を計測しながら継続的に改善してください',
  ].join('\n')

  // 売上につながりやすい次の一手
  let quickWin = ''
  if (allLp.length > 0 && allLine.some((l) => l.lineRegistrationUrl)) {
    quickWin = 'LP案とLINE登録URLが揃っているので、SNS投稿でLP誘導 → LINE登録の導線を今週から実行できます。週3回以上投稿して誘導数を計測してください。'
  } else if (allContent.length > 0 && inp.personas.length > 0) {
    quickWin = `作成済みのコンテンツ案（${allContent.length}件）をSNSに投稿することで、今すぐ認知拡大を始められます。まずSNS投稿を週3回継続し、フォロワーを増やすことが最短ルートです。`
  } else if (inp.personas.length > 0) {
    quickWin = `ペルソナ「${inp.personas[0].name}」が定義済みです。次はコンテンツ生成でSNS投稿案を作成し、発信を開始することが最優先です。`
  } else {
    quickWin = 'まずペルソナを1件作成することが最優先です。誰に届けるかを明確にすることで、すべての施策の質が上がります。'
  }

  // 今後作るべきコンテンツ案
  const contentIdeas: string[] = []
  const sn = inp.sourceName
  if (!allContent.some((c) => c.contentType === 'sns_post')) {
    contentIdeas.push(`「${sn}」の制作プロセス投稿（SNS認知拡大の定番コンテンツ）`)
  }
  if (inp.sourceType === 'workshop' && !allContent.some((c) => c.contentType === 'ws_announce')) {
    contentIdeas.push('ワークショップ体験レポート・参加者の声（集客に直結）')
  }
  if (!allContent.some((c) => c.contentType === 'line_message')) {
    contentIdeas.push('LINE配信文（ステップ配信1〜3通目：登録→関係構築→購入促進）')
  }
  if (!allLp.some((l) => l.goal === 'artwork_sales' || l.goal === 'ws_booking')) {
    contentIdeas.push('販売・予約LPのキャッチコピーと本文（購入意欲を高めるセールスコピー）')
  }
  contentIdeas.push(`「${sn}」を選ぶ理由・実績・お客様の声（信頼構築コンテンツ）`)
  if (inp.personas.length > 0 && inp.personas[0].pains[0]) {
    contentIdeas.push(
      `ペルソナの悩み「${inp.personas[0].pains[0].slice(0, 25)}」に答えるコンテンツ（共感→信頼構築）`
    )
  }

  return { topPriority, quickWin, activeFlows, weakFlows, contentIdeas }
}

// ─── メイン診断関数 ───────────────────────────────────────

export function generateConsultantReport(inp: DiagnosticInput): ConsultantReport {
  const personaIds = inp.personas.map((p) => p.id)

  const phases: ConsultantPhaseItem[] = [
    diagnoseAwareness(inp, personaIds),
    diagnoseAcquisition(inp, personaIds),
    diagnoseSales(inp, personaIds),
    diagnoseRetention(inp, personaIds),
  ]

  const overall = diagnoseOverall(inp, phases)

  const now = new Date().toISOString()

  return {
    id: `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sourceType: inp.sourceType,
    sourceId: inp.sourceId,
    sourceName: inp.sourceName,
    phases,
    topPriority: overall.topPriority,
    quickWin: overall.quickWin,
    activeFlows: overall.activeFlows,
    weakFlows: overall.weakFlows,
    contentIdeas: overall.contentIdeas,
    aiDisclaimer:
      '※ この診断はAIによるルールベースの提案です。実際の状況・判断・優先順位はご自身の経験と直感で最終確認してください。AIの提案はあくまで参考情報であり、最終的な行動の決定は人間が行います。',
    status: 'draft',
    generatedAt: now,
    updatedAt: now,
  }
}
