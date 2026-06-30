'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Brand, Artwork, Workshop } from '@/types'
import { getBrand, getArtworks, getWorkshops } from '@/lib/storage'
import { analyzeTarget, type AnalysisSourceType, type AnalysisResult } from '@/lib/analysis'

// ─── 型 ────────────────────────────────────────────────

type TargetItem = {
  id: string
  label: string
  sub: string
}

// ─── 定数 ──────────────────────────────────────────────

const TAB_LIST: { type: AnalysisSourceType; label: string; description: string }[] = [
  { type: 'brand',    label: 'ブランド',          description: '活動全体の方向性を分析' },
  { type: 'artwork',  label: '作品',              description: '個別作品の販売・認知を分析' },
  { type: 'workshop', label: 'ワークショップ',    description: 'WS集客・定着を分析' },
]

const PHASE_CONFIG = [
  { key: 'awareness' as const, label: '認知',       color: 'blue',   border: 'border-blue-200',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-400' },
  { key: 'acquisition' as const, label: '集客',     color: 'green',  border: 'border-green-200',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800',  dot: 'bg-green-400' },
  { key: 'salesChannelPlan' as const, label: '販売導線', color: 'amber', border: 'border-amber-200',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-400' },
  { key: 'retention' as const, label: 'リピーター', color: 'purple', border: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400' },
] as const

// ─── メインページ ───────────────────────────────────────

export default function AnalysisPage() {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [activeTab, setActiveTab] = useState<AnalysisSourceType>('brand')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
  }, [])

  // タブ切替時は選択・結果をリセット
  function handleTabChange(type: AnalysisSourceType) {
    setActiveTab(type)
    setSelectedId(null)
    setResult(null)
  }

  function handleSelectItem(id: string) {
    setSelectedId(id)
    setResult(null)
  }

  function handleAnalyze() {
    if (!selectedId) return
    let source: Brand | Artwork | Workshop | null = null
    if (activeTab === 'brand') source = brand
    if (activeTab === 'artwork') source = artworks.find((a) => a.id === selectedId) ?? null
    if (activeTab === 'workshop') source = workshops.find((w) => w.id === selectedId) ?? null
    if (!source) return
    setResult(analyzeTarget(activeTab, source))
    // 結果へスクロール
    setTimeout(() => {
      document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  function handleReset() {
    setResult(null)
    setSelectedId(null)
  }

  // タブごとのアイテム一覧
  const itemList: TargetItem[] = (() => {
    if (activeTab === 'brand') {
      return brand
        ? [{ id: brand.id, label: brand.name, sub: brand.activities || '活動内容を登録してください' }]
        : []
    }
    if (activeTab === 'artwork') {
      return artworks.map((a) => ({
        id: a.id,
        label: a.title,
        sub: `${a.genre || ''} ${a.price ? '¥' + a.price.toLocaleString() : ''}`.trim(),
      }))
    }
    return workshops.map((w) => ({
      id: w.id,
      label: w.title,
      sub: `${w.format === 'in-person' ? '対面' : w.format === 'online' ? 'オンライン' : '出張'} ¥${w.price.toLocaleString()}/人`,
    }))
  })()

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">AIマーケティング分析</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">全フェーズ</span>
        </div>
        <p className="text-sm text-slate-500">
          登録したブランド・作品・WSをもとに、認知〜リピーターの4軸で課題と施策を整理します
        </p>
      </div>

      {/* この画面の役割 */}
      {!brand && artworks.length === 0 && workshops.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-5">
          <p className="text-sm font-semibold text-amber-900 mb-1">まず素材を登録してください</p>
          <p className="text-xs text-amber-700 mb-3">
            AI分析を行うには、分析対象となるブランド・作品・WSのいずれかが必要です。
            登録後にこの画面に戻ってくると、AI分析を実行できます。
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/brand" className="text-xs font-medium px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">ブランドを登録 →</a>
            <a href="/artworks/new" className="text-xs font-medium px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">作品を登録 →</a>
            <a href="/workshops/new" className="text-xs font-medium px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">WSを登録 →</a>
          </div>
        </div>
      )}
      {(brand || artworks.length > 0 || workshops.length > 0) && !result && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-indigo-800 mb-1">この画面でできること</p>
          <p className="text-xs text-indigo-700">
            ブランド・作品・WSのうち分析したいものを選んで「分析する」を押すと、
            認知・集客・販売・リピーターの4軸で<strong>課題と改善施策</strong>をAIが整理します。
            分析結果はペルソナ作成の参考として使えます。
          </p>
        </div>
      )}

      {/* ─── ステップ1：分析対象の選択 ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
          <h2 className="font-semibold text-slate-900">分析対象の種類を選ぶ</h2>
        </div>

        <div className="flex gap-2 mb-5">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.type}
              onClick={() => handleTabChange(tab.type)}
              className={`flex-1 text-center py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                activeTab === tab.type
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span className="block">{tab.label}</span>
              <span className={`text-xs font-normal mt-0.5 block ${activeTab === tab.type ? 'text-indigo-200' : 'text-slate-400'}`}>
                {tab.description}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
          <h2 className="font-semibold text-slate-900">分析する対象を選択する</h2>
        </div>

        {itemList.length === 0 ? (
          <EmptyState type={activeTab} />
        ) : (
          <div className="space-y-2">
            {itemList.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={`w-full text-left flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                  selectedId === item.id
                    ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/40'
                }`}
              >
                <div>
                  <p className={`font-medium text-sm ${selectedId === item.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                    {item.label}
                  </p>
                  {item.sub && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>
                  )}
                </div>
                {selectedId === item.id && (
                  <span className="text-indigo-600 text-xs font-semibold">選択中</span>
                )}
              </button>
            ))}
          </div>
        )}

        {selectedId && !result && (
          <button
            onClick={handleAnalyze}
            className="mt-5 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            この対象でマーケティング分析を実行する
          </button>
        )}
      </div>

      {/* ─── 分析結果 ─── */}
      {result && (
        <div id="analysis-result">
          {/* AI免責バナー */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
            <span className="text-amber-500 text-lg flex-shrink-0 mt-0.5">!</span>
            <div>
              <p className="text-sm font-medium text-amber-800">AIの提案です。最終判断は必ず人間が行ってください。</p>
              <p className="text-xs text-amber-700 mt-0.5">
                以下の分析・施策はAIが生成した提案です。あなたの状況・優先度・リソースに応じて取捨選択してください。
              </p>
            </div>
          </div>

          {/* 対象ラベル */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">分析対象：</span>
              <span className="text-sm font-bold text-slate-900">{result.sourceLabel}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {result.sourceType === 'brand' ? 'ブランド' : result.sourceType === 'artwork' ? '作品' : 'WS'}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-indigo-600 underline"
            >
              別の対象を選ぶ
            </button>
          </div>

          {/* 想定顧客 & 強み */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">想定顧客</p>
              <p className="text-sm text-slate-700 leading-relaxed">{result.targetCustomer}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">強み・特徴</p>
              <ul className="space-y-1">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-1.5">
                    <span className="text-slate-300 flex-shrink-0 mt-0.5">▸</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 売り方の方向性 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">売り方の方向性</p>
            <p className="text-sm text-slate-700 leading-relaxed">{result.salesDirection}</p>
          </div>

          {/* 4フェーズ施策グリッド */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {PHASE_CONFIG.map((phase) => (
              <div key={phase.key} className={`rounded-2xl border ${phase.border} ${phase.bg} p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${phase.badge}`}>
                    {phase.label}
                  </span>
                  <span className="text-xs text-slate-500">施策</span>
                </div>
                <ul className="space-y-2">
                  {result[phase.key].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${phase.dot} mt-1.5`} />
                      <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* 次にやるべきアクション */}
          <div className="bg-indigo-600 rounded-2xl p-6 mb-4">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-3">次にやるべきアクション</p>
            <p className="text-xs text-indigo-300 mb-4">今すぐ → 次に整える → 後で検討 の順に優先度が下がります</p>
            <ol className="space-y-2.5">
              {result.nextActions.map((action, i) => {
                const isNow = action.startsWith('[今すぐ]')
                const isNext = action.startsWith('[次に整える]')
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 ${
                      isNow ? 'bg-red-400 text-white' : isNext ? 'bg-yellow-400 text-slate-900' : 'bg-white/20 text-white'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-white leading-relaxed">{action}</span>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* ペルソナ作成への接続 */}
          <div className="bg-white rounded-2xl border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">次のステップ</span>
            </div>
            <h3 className="font-semibold text-slate-900 mt-2 mb-1">分析結果からペルソナを作成する</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              この分析で見えてきた「想定顧客」をもとに、ペルソナ（具体的な顧客像）を作成することで、SNS投稿・LPのメッセージ精度が上がります。
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-2">ペルソナの初期ヒント（分析結果より）</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-400">想定顧客</p>
                  <p className="text-sm text-slate-700">{result.personaHints.targetDescription}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">ニーズ・欲求</p>
                  <ul className="mt-0.5 space-y-0.5">
                    {result.personaHints.needs.map((n, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-1">
                        <span className="text-slate-300 flex-shrink-0">·</span>
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-slate-400">主な接触チャネル</p>
                  <div className="flex gap-1.5 mt-0.5 flex-wrap">
                    {result.personaHints.desiredChannels.map((ch, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/personas/new"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              この情報でペルソナを作成する
              <span className="text-purple-300">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 空状態コンポーネント ───────────────────────────────

function EmptyState({ type }: { type: AnalysisSourceType }) {
  const config = {
    brand: {
      message: 'ブランドがまだ登録されていません',
      sub: 'ブランド管理ページで活動内容・強み・想定顧客を登録してから分析できます',
      href: '/brand',
      linkLabel: 'ブランドを登録する',
    },
    artwork: {
      message: '作品がまだ登録されていません',
      sub: '作品管理ページで作品を登録してから分析できます',
      href: '/artworks/new',
      linkLabel: '作品を登録する',
    },
    workshop: {
      message: 'ワークショップがまだ登録されていません',
      sub: 'WS管理ページでWSを登録してから分析できます',
      href: '/workshops/new',
      linkLabel: 'WSを登録する',
    },
  }
  const c = config[type]
  return (
    <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
      <p className="text-sm font-medium text-slate-500">{c.message}</p>
      <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
      <Link
        href={c.href}
        className="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
      >
        {c.linkLabel}
      </Link>
    </div>
  )
}
