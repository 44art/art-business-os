'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  Persona, Brand, Artwork, Workshop,
  ContentDraft, LandingPageDraft, LpGoal, LpSection, UsageStatus,
} from '@/types'
import {
  getBrand, getArtworks, getWorkshops, getPersonas,
  getContentDrafts, getLpDrafts, saveLpDraft, updateLpDraft, deleteLpDraft,
} from '@/lib/storage'
import { CopyButton } from '@/components/CopyButton'
import { UsageStatusBadge } from '@/components/UsageStatusBadge'
import { generateLpSections, LP_GOAL_CONFIG, SECTION_KEYS } from '@/lib/lp'

// ─── 定数 ──────────────────────────────────────────────────

const ALL_GOALS = Object.keys(LP_GOAL_CONFIG) as LpGoal[]

const SOURCE_LABEL: Record<string, string> = {
  brand: 'ブランド', artwork: '作品', workshop: 'WS',
}
const SOURCE_COLOR: Record<string, string> = {
  brand: 'bg-indigo-100 text-indigo-700',
  artwork: 'bg-amber-100 text-amber-700',
  workshop: 'bg-green-100 text-green-700',
}
const CONTENT_TYPE_LABEL: Record<string, string> = {
  sns_post: 'SNS投稿', ws_announce: 'WS告知文',
  artwork_sales: '作品販売文', line_message: 'LINE配信文', lp_intro: 'LP導入文',
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── メインページ ───────────────────────────────────────────

export default function LpPage() {
  // マスターデータ
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([])
  const [savedLps, setSavedLps] = useState<LandingPageDraft[]>([])

  // 生成フォーム state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<LpGoal | null>(null)

  // LP editor state
  const [sections, setSections] = useState<LpSection[]>([])
  const [lineCtaText, setLineCtaText] = useState('')
  const [lineRegistrationUrl, setLineRegistrationUrl] = useState('')
  const [currentDraft, setCurrentDraft] = useState<LandingPageDraft | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  // UI state
  const [expandedSectionKeys, setExpandedSectionKeys] = useState<Set<string>>(new Set(['hero_headline', 'sub_copy', 'reader_pain']))
  const [expandedLpId, setExpandedLpId] = useState<string | null>(null)

  const loadAll = useCallback(() => {
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
    setPersonas(getPersonas())
    setContentDrafts(getContentDrafts())
    setSavedLps(getLpDrafts())
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  function getSourceForPersona(persona: Persona): Brand | Artwork | Workshop | null {
    if (persona.sourceType === 'brand') return brand
    if (persona.sourceType === 'artwork') return artworks.find((a) => a.id === persona.sourceId) ?? null
    return workshops.find((w) => w.id === persona.sourceId) ?? null
  }

  // ── 生成 ──
  function handleGenerate() {
    if (!selectedPersonaId || !selectedGoal) return
    const persona = personas.find((p) => p.id === selectedPersonaId)
    if (!persona) return
    const source = getSourceForPersona(persona)
    const referencedContent = contentDrafts.find((c) => c.id === selectedContentId) ?? null

    const { sections: generated, lineCtaText: lineCta } = generateLpSections({
      goal: selectedGoal,
      persona,
      source,
      referencedContent,
    })

    setSections(generated)
    setLineCtaText(lineCta)
    setLineRegistrationUrl('')
    setExpandedSectionKeys(new Set(['hero_headline', 'sub_copy', 'reader_pain']))

    const now = new Date().toISOString()
    const draft: LandingPageDraft = {
      id: generateId(),
      personaId: persona.id,
      personaName: persona.name,
      sourceType: persona.sourceType,
      sourceId: persona.sourceId,
      sourceName: persona.sourceName,
      referencedContentId: selectedContentId ?? undefined,
      referencedContentName: referencedContent?.contentType
        ? (CONTENT_TYPE_LABEL[referencedContent.contentType] ?? undefined)
        : undefined,
      goal: selectedGoal,
      goalLabel: LP_GOAL_CONFIG[selectedGoal].label,
      sections: generated,
      lineCtaText: lineCta,
      lineRegistrationUrl: '',
      status: 'draft',
      generatedAt: now,
      updatedAt: now,
    }
    setCurrentDraft(draft)
    setIsSaved(false)
    setTimeout(() => {
      document.getElementById('lp-editor')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ── セクション更新 ──
  function updateSection(key: string, content: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, content } : s))
    )
    setIsSaved(false)
  }

  function toggleSectionExpanded(key: string) {
    setExpandedSectionKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── 保存 ──
  function handleSave() {
    if (!currentDraft) return
    const now = new Date().toISOString()
    const toSave: LandingPageDraft = {
      ...currentDraft,
      sections,
      lineCtaText,
      lineRegistrationUrl,
      status: 'saved',
      updatedAt: now,
    }
    saveLpDraft(toSave)
    setCurrentDraft(toSave)
    setIsSaved(true)
    setSavedLps(getLpDrafts())
  }

  // ── 削除 ──
  function handleDeleteLp(id: string) {
    if (!window.confirm('このLP案を削除しますか？')) return
    deleteLpDraft(id)
    setSavedLps(getLpDrafts())
  }

  // ── 複製 ──
  function handleDuplicateLp(lp: LandingPageDraft) {
    const now = new Date().toISOString()
    const copy: LandingPageDraft = {
      ...lp,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'draft',
      usageStatus: 'unused',
      generatedAt: now,
      updatedAt: now,
    }
    saveLpDraft(copy)
    setSavedLps(getLpDrafts())
  }

  function handleUpdateStatusLp(id: string, status: UsageStatus) {
    updateLpDraft(id, { usageStatus: status })
    setSavedLps(getLpDrafts())
  }

  // ── 再編集 ──
  function handleReedit(lp: LandingPageDraft) {
    setSelectedPersonaId(lp.personaId)
    setSelectedContentId(lp.referencedContentId ?? null)
    setSelectedGoal(lp.goal)
    setSections(lp.sections)
    setLineCtaText(lp.lineCtaText)
    setLineRegistrationUrl(lp.lineRegistrationUrl)
    setCurrentDraft(lp)
    setIsSaved(true)
    setExpandedSectionKeys(new Set(['hero_headline', 'sub_copy', 'reader_pain']))
    setTimeout(() => {
      document.getElementById('lp-editor')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ── 全文コピー ──
  function handleCopyAll() {
    const text = sections
      .map((s) => `【${s.label}】\n${s.content}`)
      .join('\n\n─────\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) ?? null
  const filteredContents = selectedPersonaId
    ? contentDrafts.filter((c) => c.personaId === selectedPersonaId)
    : contentDrafts

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">LP作成支援</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">販売</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">集客</span>
        </div>
        <p className="text-sm text-slate-500">
          ペルソナとLP目的を選ぶと、9セクションのLP構成案と本文たたき台を生成します
        </p>
      </div>

      {/* ─── 選択パネル ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        {/* ペルソナ選択 */}
        <StepLabel n={1} label="ペルソナを選ぶ" />
        {personas.length === 0 ? (
          <NoDataHint href="/personas/new" label="ペルソナを先に作成してください" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPersonaId(p.id); setCurrentDraft(null); setIsSaved(false) }}
                className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                  selectedPersonaId === p.id
                    ? 'bg-indigo-50 border-indigo-400'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-medium text-sm text-slate-800 truncate">{p.name}</span>
                  <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full ${SOURCE_COLOR[p.sourceType]}`}>
                    {SOURCE_LABEL[p.sourceType]}
                  </span>
                </div>
                {selectedPersonaId === p.id && (
                  <div className="mt-2 space-y-1">
                    {p.pains[0] && <p className="text-xs text-slate-500">悩み：{p.pains[0].slice(0, 30)}</p>}
                    {p.desires[0] && <p className="text-xs text-slate-500">欲求：{p.desires[0].slice(0, 30)}</p>}
                    {p.purchaseAnxiety && <p className="text-xs text-slate-500">不安：{p.purchaseAnxiety.split('\n')[0].slice(0, 30)}</p>}
                    {p.resonantPhrases[0] && <p className="text-xs text-indigo-600">刺さる言葉：{p.resonantPhrases[0].slice(0, 30)}</p>}
                    <p className="text-xs text-slate-400">導線：{p.salesChannelFit.slice(0, 40)}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* コンテンツ参照（任意） */}
        <StepLabel n={2} label="保存済みコンテンツを参照する（任意）" />
        <p className="text-xs text-slate-400 mb-3">
          保存済みのコンテンツを選ぶと、その強み・CTA文言をLP生成に活用します
        </p>
        {filteredContents.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl mb-6">
            <p className="text-xs text-slate-400">
              {contentDrafts.length === 0
                ? '保存済みコンテンツがありません（スキップ可）'
                : 'このペルソナのコンテンツがありません（スキップ可）'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {filteredContents.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedContentId(selectedContentId === c.id ? null : c.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selectedContentId === c.id
                    ? 'bg-indigo-50 border-indigo-400'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-slate-700">{CONTENT_TYPE_LABEL[c.contentType]}</span>
                  <span className="text-xs text-slate-400">ペルソナ：{c.personaName}</span>
                  {selectedContentId === c.id && (
                    <span className="ml-auto text-xs text-indigo-600 font-semibold">参照中</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{c.content.slice(0, 60)}</p>
              </button>
            ))}
          </div>
        )}

        {/* LP目的選択 */}
        <StepLabel n={3} label="LPの目的を選ぶ" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {ALL_GOALS.map((goal) => {
            const cfg = LP_GOAL_CONFIG[goal]
            return (
              <button
                key={goal}
                onClick={() => { setSelectedGoal(goal); setCurrentDraft(null); setIsSaved(false) }}
                className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                  selectedGoal === goal
                    ? 'bg-indigo-50 border-indigo-400'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-slate-800">{cfg.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.phaseColor}`}>
                    {cfg.phaseLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{cfg.description}</p>
              </button>
            )
          })}
        </div>

        {/* 生成ボタン */}
        <button
          onClick={handleGenerate}
          disabled={!selectedPersonaId || !selectedGoal}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {(!selectedPersonaId || !selectedGoal)
            ? 'ペルソナとLP目的を選択してください'
            : 'LP構成案を生成する'}
        </button>
      </div>

      {/* ─── LP エディタ ─── */}
      {sections.length > 0 && currentDraft && (
        <div id="lp-editor">
          {/* AI免責 */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">!</span>
            <p className="text-xs text-amber-700">
              AIの提案です。各セクションを確認・編集してから保存してください。最終的な文章の判断はあなたが行います。
            </p>
          </div>

          {/* LP情報ヘッダー */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${LP_GOAL_CONFIG[currentDraft.goal].phaseColor}`}>
                {LP_GOAL_CONFIG[currentDraft.goal].phaseLabel}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {LP_GOAL_CONFIG[currentDraft.goal].label}
              </span>
              <span className="text-xs text-slate-400">ペルソナ：{currentDraft.personaName}</span>
            </div>
            <button
              onClick={handleCopyAll}
              className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
            >
              全文コピー
            </button>
          </div>

          {/* セクションエディタ */}
          <div className="space-y-3 mb-4">
            {sections.map((section, idx) => {
              const isExpanded = expandedSectionKeys.has(section.key)
              const sectionCfg = SECTION_KEYS[idx]
              return (
                <div
                  key={section.key}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSectionExpanded(section.key)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                        {!isExpanded && section.content && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                            {section.content.split('\n')[0].slice(0, 50)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <p className="text-xs text-slate-400 mb-2">{sectionCfg?.hint}</p>
                      <textarea
                        rows={section.content.split('\n').length + 2}
                        value={section.content}
                        onChange={(e) => updateSection(section.key, e.target.value)}
                        className="w-full text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono bg-slate-50"
                      />
                      <p className="text-xs text-slate-400 mt-1 text-right">
                        {section.content.length}文字
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* LINE引き継ぎ設定 */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                LINE活用支援へ引き継ぎ
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  LINEへの誘導文
                </label>
                <textarea
                  rows={3}
                  value={lineCtaText}
                  onChange={(e) => { setLineCtaText(e.target.value); setIsSaved(false) }}
                  className="w-full text-sm border border-purple-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white resize-y"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  LINE登録URL（任意）
                </label>
                <input
                  type="text"
                  value={lineRegistrationUrl}
                  onChange={(e) => { setLineRegistrationUrl(e.target.value); setIsSaved(false) }}
                  placeholder="https://lin.ee/xxxxxxx"
                  className="w-full text-sm border border-purple-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            onClick={handleSave}
            className={`w-full py-3 font-semibold rounded-xl transition-colors ${
              isSaved
                ? 'bg-green-600 text-white cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSaved ? 'LP案を保存済み ✓' : 'このLP案を保存する'}
          </button>
          {isSaved && (
            <p className="text-center text-xs text-slate-400 mt-2">
              保存しました。下の「保存済みLP案」に追加されています。
            </p>
          )}
        </div>
      )}

      {/* ─── 保存済みLP一覧 ─── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">保存済みLP案</h2>
          <span className="text-sm text-slate-400">{savedLps.length}件</span>
        </div>

        {savedLps.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">まだ保存済みLP案がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedLps.map((lp) => {
              const cfg = LP_GOAL_CONFIG[lp.goal]
              const heroSection = lp.sections.find((s) => s.key === 'hero_headline')
              const isExpanded = expandedLpId === lp.id
              return (
                <div key={lp.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.phaseColor}`}>
                          {cfg.phaseLabel}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{cfg.label}</span>
                        <UsageStatusBadge status={lp.usageStatus} onChange={(s) => handleUpdateStatusLp(lp.id, s)} />
                        <span className="text-xs text-slate-400">/ {lp.personaName}</span>
                      </div>
                      {heroSection && (
                        <p className="text-sm text-slate-700 font-medium mb-1">
                          {heroSection.content.split('\n')[0].slice(0, 60)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <a
                          href={`/personas/${lp.personaId}/edit`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {lp.personaName} →
                        </a>
                        <span className="text-slate-300">|</span>
                        <a
                          href={lp.sourceType === 'brand' ? '/brand' : lp.sourceType === 'artwork' ? `/artworks/${lp.sourceId}/edit` : `/workshops/${lp.sourceId}/edit`}
                          className="text-xs text-slate-500 hover:underline"
                        >
                          {lp.sourceName} →
                        </a>
                        {lp.referencedContentName && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                            参照：{lp.referencedContentName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleReedit(lp)}
                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDuplicateLp(lp)}
                        className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium transition-colors"
                      >
                        複製
                      </button>
                      <button
                        onClick={() => handleDeleteLp(lp.id)}
                        className="text-xs px-3 py-1.5 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-lg font-medium transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedLpId(isExpanded ? null : lp.id)}
                    className="mt-2 text-xs text-slate-400 hover:text-indigo-600 underline"
                  >
                    {isExpanded ? '折り畳む' : '全セクションを見る'}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {lp.sections.map((s) => (
                        <div key={s.key} className="border-l-2 border-slate-200 pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-slate-500">{s.label}</p>
                            <CopyButton text={s.content} />
                          </div>
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                            {s.content}
                          </pre>
                        </div>
                      ))}
                      {lp.lineCtaText && (
                        <div className="border-l-2 border-purple-200 pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-purple-500">LINE誘導文</p>
                            <CopyButton text={lp.lineCtaText} />
                          </div>
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                            {lp.lineCtaText}
                          </pre>
                          {lp.lineRegistrationUrl && (
                            <p className="text-xs text-slate-400 mt-1">URL: {lp.lineRegistrationUrl}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* LINE活用支援への接続案内 */}
        {savedLps.length > 0 && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-purple-900 mb-1">次のステップ：LINE活用支援</p>
            <p className="text-xs text-purple-700 mb-3">
              保存したLP案の「LINE誘導文」・ペルソナデータをもとに、LINE配信文・ステップ配信案を作成できます
            </p>
            <a href="/line" className="inline-block text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
              LINE活用支援へ →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 小コンポーネント ───────────────────────────────────────

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
        {n}
      </span>
      <h2 className="font-semibold text-slate-900">{label}</h2>
    </div>
  )
}

function NoDataHint({ href, label }: { href: string; label: string }) {
  return (
    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl mb-6">
      <p className="text-sm text-slate-500 mb-2">{label}</p>
      <a href={href} className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline">
        → 作成ページへ
      </a>
    </div>
  )
}
