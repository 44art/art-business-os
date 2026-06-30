'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type {
  Brand,
  Artwork,
  Workshop,
  Persona,
  ContentDraft,
  LandingPageDraft,
  LineStrategyDraft,
  SnsStrategyDraft,
  ConsultantReport,
} from '@/types'
import {
  getBrand,
  getArtworks,
  getWorkshops,
  getPersonas,
  getContentDrafts,
  getLpDrafts,
  getLineDrafts,
  getSnsDrafts,
  getConsultantReports,
} from '@/lib/storage'

// ─── 型 ──────────────────────────────────────────────────

type PhaseStatus = 'done' | 'partial' | 'empty'

type PhaseData = {
  key: string
  label: string
  color: string
  bgColor: string
  borderColor: string
  badgeColor: string
  status: PhaseStatus
  items: Array<{ label: string; count: number; href: string; done: boolean }>
  nextAction: { label: string; href: string } | null
}

type RecentItem = {
  label: string
  sub: string
  href: string
  date: string
  phaseColor: string
  phaseLabel: string
}

type DashboardData = {
  brand: Brand | null
  artworks: Artwork[]
  workshops: Workshop[]
  personas: Persona[]
  contentDrafts: ContentDraft[]
  lpDrafts: LandingPageDraft[]
  lineDrafts: LineStrategyDraft[]
  snsDrafts: SnsStrategyDraft[]
  consultantReports: ConsultantReport[]
}

// ─── ユーティリティ ───────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function phaseStatus(done: number, partial: number): PhaseStatus {
  if (done >= 1) return 'done'
  if (partial >= 1) return 'partial'
  return 'empty'
}

// ─── フェーズデータ構築 ──────────────────────────────────

function buildPhases(d: DashboardData): PhaseData[] {
  // 認知フェーズ
  const snsAwareness = d.snsDrafts.filter((s) =>
    s.goal === 'awareness' || s.goal === 'fan'
  ).length
  const contentSns = d.contentDrafts.filter((c) => c.contentType === 'sns_post').length
  const awarenessStatus = phaseStatus(snsAwareness + contentSns, d.personas.length)

  // 集客フェーズ
  const lpAcq = d.lpDrafts.filter((l) =>
    l.goal === 'ws_booking' || l.goal === 'line_register' || l.goal === 'inquiry'
  ).length
  const lineAcq = d.lineDrafts.length
  const contentWs = d.contentDrafts.filter((c) => c.contentType === 'ws_announce').length
  const acquisitionStatus = phaseStatus(lpAcq + lineAcq, contentWs + d.workshops.length)

  // 販売フェーズ
  const artworksSelling = d.artworks.filter((a) => a.status === 'selling').length
  const lpSales = d.lpDrafts.filter((l) =>
    l.goal === 'artwork_sales' || l.goal === 'ws_booking'
  ).length
  const contentSales = d.contentDrafts.filter(
    (c) => c.contentType === 'artwork_sales' || c.contentType === 'lp_intro'
  ).length
  const salesStatus = phaseStatus(lpSales + contentSales, artworksSelling)

  // リピーターフェーズ
  const lineRepeat = d.lineDrafts.filter((l) =>
    l.goal === 'repeat' || l.goal === 'fan'
  ).length
  const contentLine = d.contentDrafts.filter((c) => c.contentType === 'line_message').length
  const retentionStatus = phaseStatus(lineRepeat + contentLine, d.lineDrafts.length)

  return [
    {
      key: 'awareness',
      label: '認知',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-700',
      status: awarenessStatus,
      items: [
        { label: 'ペルソナ',     count: d.personas.length,  href: '/personas',     done: d.personas.length > 0 },
        { label: 'コンテンツ',   count: contentSns,          href: '/content',      done: contentSns > 0 },
        { label: 'SNS戦略',     count: snsAwareness,        href: '/sns-strategy', done: snsAwareness > 0 },
      ],
      nextAction: d.personas.length === 0
        ? { label: 'ペルソナを作成する', href: '/personas/new' }
        : contentSns === 0
        ? { label: 'SNS投稿コンテンツを生成する', href: '/content' }
        : snsAwareness === 0
        ? { label: 'SNS認知拡大戦略を作成する', href: '/sns-strategy' }
        : null,
    },
    {
      key: 'acquisition',
      label: '集客',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-100 text-green-700',
      status: acquisitionStatus,
      items: [
        { label: 'WS登録',    count: d.workshops.length, href: '/workshops', done: d.workshops.length > 0 },
        { label: 'LP案',      count: lpAcq,              href: '/lp',        done: lpAcq > 0 },
        { label: 'LINE戦略',  count: lineAcq,            href: '/line',      done: lineAcq > 0 },
      ],
      nextAction: d.workshops.length === 0 && d.artworks.length === 0
        ? { label: '作品またはWSを登録する', href: '/artworks' }
        : d.personas.length === 0
        ? { label: 'ペルソナを作成する', href: '/personas/new' }
        : lpAcq === 0
        ? { label: 'LP構成案を作成する', href: '/lp' }
        : lineAcq === 0
        ? { label: 'LINE戦略を作成する', href: '/line' }
        : null,
    },
    {
      key: 'sales',
      label: '販売',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-700',
      status: salesStatus,
      items: [
        { label: '販売中の作品', count: artworksSelling,   href: '/artworks',  done: artworksSelling > 0 },
        { label: '販売用LP案',  count: lpSales,            href: '/lp',        done: lpSales > 0 },
        { label: '販売文',      count: contentSales,        href: '/content',   done: contentSales > 0 },
      ],
      nextAction: artworksSelling === 0
        ? { label: '作品を登録して販売状態にする', href: '/artworks/new' }
        : lpSales === 0
        ? { label: '作品販売用LP案を作成する', href: '/lp' }
        : contentSales === 0
        ? { label: '作品販売文を生成する', href: '/content' }
        : null,
    },
    {
      key: 'retention',
      label: 'リピーター化',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      badgeColor: 'bg-purple-100 text-purple-700',
      status: retentionStatus,
      items: [
        { label: 'LINE戦略（リピーター）', count: lineRepeat,   href: '/line',     done: lineRepeat > 0 },
        { label: 'LINE配信文',            count: contentLine,  href: '/content',  done: contentLine > 0 },
        { label: 'SNS戦略（ファン化）',   count: d.snsDrafts.filter((s) => s.goal === 'fan' || s.goal === 'repeat').length,
          href: '/sns-strategy', done: d.snsDrafts.some((s) => s.goal === 'fan' || s.goal === 'repeat') },
      ],
      nextAction: lineRepeat === 0
        ? { label: 'リピーター向けLINE戦略を作成する', href: '/line' }
        : contentLine === 0
        ? { label: 'LINE配信文を生成する', href: '/content' }
        : null,
    },
  ]
}

// ─── 最近の保存データ ─────────────────────────────────────

function buildRecentItems(d: DashboardData): RecentItem[] {
  const items: RecentItem[] = []

  d.contentDrafts.slice(0, 2).forEach((c) => {
    const typeLabel: Record<string, string> = {
      sns_post: 'SNS投稿', ws_announce: 'WS告知', artwork_sales: '作品販売文',
      line_message: 'LINE配信文', lp_intro: 'LP導入文',
    }
    items.push({
      label: typeLabel[c.contentType] ?? 'コンテンツ',
      sub: c.content.slice(0, 40) + '…',
      href: '/content',
      date: c.updatedAt,
      phaseColor: 'bg-blue-100 text-blue-700',
      phaseLabel: '認知・集客',
    })
  })

  d.lpDrafts.slice(0, 1).forEach((l) => {
    items.push({
      label: `LP案（${l.goalLabel}）`,
      sub: l.sourceName,
      href: '/lp',
      date: l.updatedAt,
      phaseColor: 'bg-amber-100 text-amber-700',
      phaseLabel: '販売・集客',
    })
  })

  d.lineDrafts.slice(0, 1).forEach((l) => {
    items.push({
      label: `LINE戦略（${l.goalLabel}）`,
      sub: l.sourceName,
      href: '/line',
      date: l.updatedAt,
      phaseColor: 'bg-purple-100 text-purple-700',
      phaseLabel: 'リピーター',
    })
  })

  d.snsDrafts.slice(0, 1).forEach((s) => {
    items.push({
      label: `SNS戦略（${s.goalLabel}）`,
      sub: s.platforms.map((p) => p.toUpperCase()).join('・'),
      href: '/sns-strategy',
      date: s.updatedAt,
      phaseColor: 'bg-blue-100 text-blue-700',
      phaseLabel: '認知',
    })
  })

  return items
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
}

// ─── フェーズステータスアイコン ──────────────────────────

function StatusIcon({ status }: { status: PhaseStatus }) {
  if (status === 'done') return <span className="text-green-500 text-base">✓</span>
  if (status === 'partial') return <span className="text-amber-400 text-base">◎</span>
  return <span className="text-slate-300 text-base">○</span>
}

// ─── メインコンポーネント ─────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    setData({
      brand: getBrand(),
      artworks: getArtworks(),
      workshops: getWorkshops(),
      personas: getPersonas(),
      contentDrafts: getContentDrafts(),
      lpDrafts: getLpDrafts(),
      lineDrafts: getLineDrafts(),
      snsDrafts: getSnsDrafts(),
      consultantReports: getConsultantReports(),
    })
  }, [])

  if (!data) return null

  const phases = buildPhases(data)
  const recentItems = buildRecentItems(data)
  const latestReport = data.consultantReports[0] ?? null
  const isStarted =
    !!data.brand ||
    data.artworks.length > 0 ||
    data.workshops.length > 0 ||
    data.personas.length > 0

  const donePhaseCount = phases.filter((p) => p.status === 'done').length
  const progressPct = Math.round((donePhaseCount / 4) * 100)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ─── ヘッダー ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
          <p className="mt-1 text-slate-500 text-sm">
            認知 → 集客 → 販売 → リピーター化の進捗を確認し、次の一手を決めましょう
          </p>
        </div>
        {data.brand ? (
          <Link
            href="/brand"
            className="text-right text-sm group"
          >
            <p className="font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
              {data.brand.name}
            </p>
            <p className="text-xs text-slate-400">ブランド登録済み ✓</p>
          </Link>
        ) : (
          <Link
            href="/brand"
            className="text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
          >
            ブランドを登録する →
          </Link>
        )}
      </div>

      {/* ─── 進捗バー ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-slate-600">マーケティング導線の整備状況</p>
          <p className="text-xs text-slate-400">{donePhaseCount}/4フェーズ準備済み</p>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-1">
          {phases.map((phase) => (
            <div key={phase.key} className="flex items-center gap-1.5">
              <StatusIcon status={phase.status} />
              <span className={`text-xs font-medium ${phase.color}`}>{phase.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── AIコンサルタント最優先アクション ─────────── */}
      {latestReport && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-indigo-700 mb-1">
                🤖 AIコンサルタント診断より — 最優先アクション
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {latestReport.topPriority}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                診断対象: {latestReport.sourceName} ／ {fmtDate(latestReport.updatedAt)}更新
              </p>
            </div>
            <Link
              href="/consultant"
              className="flex-shrink-0 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              詳細を見る
            </Link>
          </div>
        </div>
      )}

      {/* ─── 初回スタートガイド ───────────────────────── */}
      {!isStarted && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">まず最初にやること</p>
          <ol className="space-y-2 text-sm text-amber-700 list-decimal list-inside">
            <li>
              <Link href="/brand" className="underline hover:text-amber-900 font-medium">
                ブランド管理
              </Link>
              でコンセプト・強みを登録する
            </li>
            <li>
              <Link href="/artworks/new" className="underline hover:text-amber-900 font-medium">
                作品
              </Link>
              または
              <Link href="/workshops/new" className="underline hover:text-amber-900 font-medium ml-1">
                ワークショップ
              </Link>
              を登録する
            </li>
            <li>
              <Link href="/analysis" className="underline hover:text-amber-900 font-medium">
                AIマーケティング分析
              </Link>
              で現状の課題を確認する
            </li>
            <li>
              <Link href="/personas/new" className="underline hover:text-amber-900 font-medium">
                ペルソナ作成
              </Link>
              でターゲット顧客像を定義する
            </li>
          </ol>
        </div>
      )}

      {/* ─── フェーズ別進捗カード ─────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">フェーズ別の準備状況</h2>
        <div className="grid grid-cols-2 gap-4">
          {phases.map((phase) => (
            <div
              key={phase.key}
              className={`rounded-xl border ${phase.borderColor} ${phase.bgColor} p-4`}
            >
              {/* フェーズヘッダー */}
              <div className="flex items-center gap-2 mb-3">
                <StatusIcon status={phase.status} />
                <span className={`font-semibold text-sm ${phase.color}`}>{phase.label}</span>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${phase.badgeColor}`}>
                  {phase.status === 'done' ? '準備OK' : phase.status === 'partial' ? '進行中' : '未着手'}
                </span>
              </div>

              {/* チェックリスト */}
              <ul className="space-y-1.5 mb-3">
                {phase.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between text-xs hover:underline ${
                        item.done ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={item.done ? 'text-green-500' : 'text-slate-300'}>
                          {item.done ? '✓' : '○'}
                        </span>
                        {item.label}
                      </span>
                      {item.count > 0 && (
                        <span className="text-slate-400 tabular-nums">{item.count}件</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* 次のアクション */}
              {phase.nextAction && (
                <Link
                  href={phase.nextAction.href}
                  className={`block w-full text-center text-xs font-medium py-1.5 rounded-lg transition-colors
                    ${phase.borderColor} border bg-white/70 ${phase.color} hover:bg-white`}
                >
                  → {phase.nextAction.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── 素材・データ登録サマリー ─────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">登録データのサマリー</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'ブランド',
              value: data.brand ? '登録済み' : '未登録',
              sub: data.brand?.name ?? '—',
              href: '/brand',
              done: !!data.brand,
            },
            {
              label: '作品',
              value: `${data.artworks.length}件`,
              sub: `販売中 ${data.artworks.filter((a) => a.status === 'selling').length}件`,
              href: '/artworks',
              done: data.artworks.length > 0,
            },
            {
              label: 'WS',
              value: `${data.workshops.length}件`,
              sub: `募集中 ${data.workshops.filter((w) => w.status === 'open').length}件`,
              href: '/workshops',
              done: data.workshops.length > 0,
            },
            {
              label: 'ペルソナ',
              value: `${data.personas.length}件`,
              sub: data.personas[0]?.name ?? '未作成',
              href: '/personas',
              done: data.personas.length > 0,
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`bg-white rounded-xl border p-3 hover:shadow-sm transition-all group ${
                item.done ? 'border-slate-200' : 'border-dashed border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                <span className={item.done ? 'text-green-400 text-xs' : 'text-slate-300 text-xs'}>
                  {item.done ? '✓' : '未'}
                </span>
              </div>
              <p className={`text-lg font-bold ${item.done ? 'text-slate-800' : 'text-slate-300'} group-hover:text-indigo-700 transition-colors`}>
                {item.value}
              </p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{item.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── 生成物サマリー ───────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-3">作成済みコンテンツのサマリー</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              label: 'コンテンツ',
              count: data.contentDrafts.length,
              href: '/content',
              color: 'text-blue-600',
              bg: 'bg-blue-50',
            },
            {
              label: 'LP案',
              count: data.lpDrafts.length,
              href: '/lp',
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
            {
              label: 'LINE戦略',
              count: data.lineDrafts.length,
              href: '/line',
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: 'SNS戦略',
              count: data.snsDrafts.length,
              href: '/sns-strategy',
              color: 'text-indigo-600',
              bg: 'bg-indigo-50',
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`rounded-xl border border-slate-200 p-3 ${item.bg} hover:shadow-sm transition-all group`}
            >
              <p className="text-xs text-slate-400 font-medium mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.count > 0 ? item.color : 'text-slate-300'} group-hover:opacity-80`}>
                {item.count}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.count > 0 ? '件作成済み' : '未作成'}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* ─── 最近の保存データ ─────────────────────────── */}
      {recentItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">最近の保存データ</h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {recentItems.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${item.phaseColor}`}>
                    {item.phaseLabel}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.sub}</p>
                  </div>
                </div>
                <p className="flex-shrink-0 text-xs text-slate-400 ml-3">{fmtDate(item.date)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── AIコンサルタントCTA（未診断の場合） ────────── */}
      {!latestReport && isStarted && (
        <Link
          href="/consultant"
          className="block bg-slate-800 text-white rounded-xl px-5 py-4 hover:bg-slate-700 transition-colors"
        >
          <p className="font-semibold text-sm mb-0.5">AIコンサルタントで現状を診断する</p>
          <p className="text-xs text-slate-400">
            登録データをもとに認知〜リピーターの導線を診断し、最優先アクションを提案します
          </p>
        </Link>
      )}

      {/* ─── AI免責フッター ───────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          <span className="font-medium text-slate-600">AIの提案について：</span>
          各機能で生成されるコンテンツ・戦略・診断はAIによる提案です。
          最終的な判断・修正・実行はあなた自身が行ってください。
        </p>
      </div>
    </div>
  )
}
