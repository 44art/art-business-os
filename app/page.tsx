'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

// カードはマーケティング導線順で並べる（登録 → 分析 → 生成 → 診断）
const cards = [
  {
    title: 'ブランド管理',
    href: '/brand',
    phase: '土台',
    phaseColor: 'bg-slate-100 text-slate-700',
    description: 'コンセプト・強み・販売導線を登録。すべてのAI生成の軸になります。',
  },
  {
    title: '作品管理',
    href: '/artworks',
    phase: '認知・販売',
    phaseColor: 'bg-blue-100 text-blue-800',
    description: '作品データを整備してSNS投稿・LP生成の素材にします。',
  },
  {
    title: 'ワークショップ管理',
    href: '/workshops',
    phase: '集客',
    phaseColor: 'bg-green-100 text-green-800',
    description: 'WS情報を整備して集客コンテンツ・LINEメッセージの素材にします。',
  },
  {
    title: 'AIマーケティング分析',
    href: '/analysis',
    phase: '全フェーズ',
    phaseColor: 'bg-slate-100 text-slate-700',
    description: '登録データをもとに認知・集客・販売・リピーターの課題をAIが分析します。',
  },
  {
    title: 'ペルソナ作成',
    href: '/personas',
    phase: '認知・集客',
    phaseColor: 'bg-blue-100 text-blue-800',
    description: 'ターゲット顧客像（悩み・欲求・刺さる言葉）を定義します。',
  },
  {
    title: 'コンテンツ生成',
    href: '/content',
    phase: '認知・集客',
    phaseColor: 'bg-blue-100 text-blue-800',
    description: 'ペルソナ×素材でSNS投稿・WS告知・作品販売文をAIが生成します。',
  },
  {
    title: 'LP作成支援',
    href: '/lp',
    phase: '販売・集客',
    phaseColor: 'bg-amber-100 text-amber-800',
    description: 'コンテンツ案をもとに作品販売・WS予約用LPの構成をAIが生成します。',
  },
  {
    title: 'LINE活用支援',
    href: '/line',
    phase: 'リピーター',
    phaseColor: 'bg-purple-100 text-purple-800',
    description: 'LP案を引き継いでLINE登録導線・ステップ配信案をAIが生成します。',
  },
  {
    title: 'SNS戦略',
    href: '/sns-strategy',
    phase: '認知・集客',
    phaseColor: 'bg-blue-100 text-blue-800',
    description: 'コンテンツ・LP・LINE案を統合し、媒体別SNS発信戦略をAIが生成します。',
  },
  {
    title: 'AIコンサルタント',
    href: '/consultant',
    phase: '全フェーズ',
    phaseColor: 'bg-slate-100 text-slate-700',
    description: '全登録データをもとに認知〜リピーターの導線を診断し、次のアクションを提案します。',
  },
]

const phases = [
  { key: 'awareness',   label: '認知',        color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  { key: 'acquisition', label: '集客',        color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  { key: 'sales',       label: '販売',        color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  { key: 'retention',   label: 'リピーター化', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
]

// フェーズごとのデータ件数（認知=SNS戦略, 集客=LP, 販売=コンテンツ, リピーター=LINE）
type PhaseCounts = Record<string, number>

export default function DashboardPage() {
  const [counts, setCounts] = useState<PhaseCounts>({
    awareness: 0, acquisition: 0, sales: 0, retention: 0,
  })
  const [hasBrand, setHasBrand] = useState(false)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const brand = getBrand()
    const artworks = getArtworks()
    const workshops = getWorkshops()
    const personas = getPersonas()
    const content = getContentDrafts()
    const lp = getLpDrafts()
    const line = getLineDrafts()
    const sns = getSnsDrafts()
    const reports = getConsultantReports()

    setHasBrand(!!brand)
    setTotalItems(
      artworks.length + workshops.length + personas.length +
      content.length + lp.length + line.length + sns.length + reports.length
    )

    // 各フェーズの「作成済みアイテム数」をカウント
    const snsSaved = sns.filter((s) => s.status === 'saved').length
    const contentSaved = content.length
    const lpSaved = lp.filter((l) => l.status === 'saved').length
    const lineSaved = line.filter((l) => l.status === 'saved').length

    setCounts({
      awareness:   snsSaved + contentSaved,
      acquisition: lpSaved,
      sales:       lpSaved + contentSaved,
      retention:   lineSaved,
    })
  }, [])

  const isStarted = hasBrand || totalItems > 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="mt-1 text-slate-500">
          認知 → 集客 → 販売 → リピーター化を支援するマーケティングツール
        </p>
      </div>

      {/* フェーズ別サマリー */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {phases.map((phase) => (
          <div key={phase.key} className={`rounded-xl border ${phase.border} ${phase.bg} p-4 text-center`}>
            <p className={`text-2xl font-bold ${phase.color}`}>
              {counts[phase.key] > 0 ? counts[phase.key] : '—'}
            </p>
            <p className={`text-xs font-semibold mt-1 ${phase.color}`}>{phase.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {counts[phase.key] > 0 ? '件作成済み' : '未着手'}
            </p>
          </div>
        ))}
      </div>

      {/* スタートガイド or 継続ガイド */}
      {!isStarted ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8">
          <p className="text-sm font-semibold text-amber-800">最初にやること</p>
          <ol className="mt-2 space-y-1 text-sm text-amber-700 list-decimal list-inside">
            <li>ブランド管理でコンセプト・強みを登録する</li>
            <li>作品またはワークショップを登録する</li>
            <li>AIマーケティング分析で現状の課題を確認する</li>
            <li>ペルソナ作成でターゲット顧客像を定義する</li>
          </ol>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-8">
          <p className="text-sm font-semibold text-blue-800">次にやること</p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-blue-700">
            {!hasBrand && <Link href="/brand" className="underline hover:text-blue-900">ブランド登録</Link>}
            {counts.awareness === 0 && <Link href="/content" className="underline hover:text-blue-900">コンテンツ生成</Link>}
            {counts.acquisition === 0 && <Link href="/lp" className="underline hover:text-blue-900">LP作成</Link>}
            {counts.retention === 0 && <Link href="/line" className="underline hover:text-blue-900">LINE戦略</Link>}
            <Link href="/consultant" className="underline hover:text-blue-900">AIコンサルタントで診断</Link>
          </div>
        </div>
      )}

      {/* 機能カード一覧 */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                {card.title}
              </h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.phaseColor}`}>
                {card.phase}
              </span>
            </div>
            <p className="text-sm text-slate-500">{card.description}</p>
          </Link>
        ))}
      </div>

      {/* AI提案・人間判断の説明 */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-xs font-semibold text-slate-600 mb-1">このツールについて</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          各機能で生成されるコンテンツ・戦略・診断結果はAIによる提案です。
          最終的な判断・修正・実行はあなた自身が行ってください。
          AIは叩き台を作り、あなたがアーティストとしての視点で仕上げます。
        </p>
      </div>
    </div>
  )
}
