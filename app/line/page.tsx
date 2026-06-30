'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  Persona, Brand, Artwork, Workshop,
  ContentDraft, LandingPageDraft, LineStrategyDraft, LineGoal, LineSection, UsageStatus,
} from '@/types'
import {
  getBrand, getArtworks, getWorkshops, getPersonas,
  getContentDrafts, getLpDrafts,
  getLineDrafts, saveLineDraft, updateLineDraft, deleteLineDraft,
} from '@/lib/storage'
import { CopyButton } from '@/components/CopyButton'
import { UsageStatusBadge } from '@/components/UsageStatusBadge'
import { generateLineSections, LINE_GOAL_CONFIG, LINE_SECTION_KEYS } from '@/lib/line'

// ─── 定数 ──────────────────────────────────────────────────

const ALL_LINE_GOALS = Object.keys(LINE_GOAL_CONFIG) as LineGoal[]

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
const LP_GOAL_LABEL: Record<string, string> = {
  artwork_sales: '作品販売', ws_booking: 'WS予約', inquiry: '問い合わせ',
  line_register: 'LINE登録', awareness: '認知拡大',
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── メインページ ───────────────────────────────────────────

export default function LinePage() {
  // マスターデータ
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([])
  const [lpDrafts, setLpDrafts] = useState<LandingPageDraft[]>([])
  const [savedLineDrafts, setSavedLineDrafts] = useState<LineStrategyDraft[]>([])

  // 生成フォーム state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [selectedLpId, setSelectedLpId] = useState<string | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<LineGoal | null>(null)

  // エディタ state
  const [sections, setSections] = useState<LineSection[]>([])
  const [lineRegistrationUrl, setLineRegistrationUrl] = useState('')
  const [recommendedChannels, setRecommendedChannels] = useState<string[]>([])
  const [snsCtaText, setSnsCtaText] = useState('')
  const [currentDraft, setCurrentDraft] = useState<LineStrategyDraft | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  // UI state
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['line_register_copy', 'greeting_message', 'message_1']))
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null)

  const loadAll = useCallback(() => {
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
    setPersonas(getPersonas())
    setContentDrafts(getContentDrafts())
    setLpDrafts(getLpDrafts())
    setSavedLineDrafts(getLineDrafts())
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
    const referencedLp = lpDrafts.find((l) => l.id === selectedLpId) ?? null

    const { sections: generated, recommendedChannels: channels, snsCtaText: snsCta } =
      generateLineSections({ goal: selectedGoal, persona, source, referencedContent, referencedLp })

    setSections(generated)
    setRecommendedChannels(channels)
    setSnsCtaText(snsCta)
    // LP案のLINE URLを引き継ぐ
    if (referencedLp?.lineRegistrationUrl) {
      setLineRegistrationUrl(referencedLp.lineRegistrationUrl)
    } else {
      setLineRegistrationUrl('')
    }
    setExpandedKeys(new Set(['line_register_copy', 'greeting_message', 'message_1']))

    const now = new Date().toISOString()
    const draft: LineStrategyDraft = {
      id: generateId(),
      personaId: persona.id,
      personaName: persona.name,
      sourceType: persona.sourceType,
      sourceId: persona.sourceId,
      sourceName: persona.sourceName,
      referencedContentId: selectedContentId ?? undefined,
      referencedContentName: referencedContent
        ? (CONTENT_TYPE_LABEL[referencedContent.contentType] ?? undefined)
        : undefined,
      referencedLpId: selectedLpId ?? undefined,
      referencedLpName: referencedLp
        ? (LP_GOAL_LABEL[referencedLp.goal] ?? referencedLp.goalLabel)
        : undefined,
      goal: selectedGoal,
      goalLabel: LINE_GOAL_CONFIG[selectedGoal].label,
      lineRegistrationUrl: referencedLp?.lineRegistrationUrl || '',
      sections: generated,
      recommendedChannels: channels,
      snsCtaText: snsCta,
      status: 'draft',
      generatedAt: now,
      updatedAt: now,
    }
    setCurrentDraft(draft)
    setIsSaved(false)
    setTimeout(() => {
      document.getElementById('line-editor')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ── セクション更新 ──
  function updateSection(key: string, content: string) {
    setSections((prev) =>
      prev.map((s) => (s.key === key ? { ...s, content } : s))
    )
    setIsSaved(false)
  }

  function toggleExpanded(key: string) {
    setExpandedKeys((prev) => {
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
    const toSave: LineStrategyDraft = {
      ...currentDraft,
      sections,
      lineRegistrationUrl,
      recommendedChannels,
      snsCtaText,
      status: 'saved',
      updatedAt: now,
    }
    saveLineDraft(toSave)
    setCurrentDraft(toSave)
    setIsSaved(true)
    setSavedLineDrafts(getLineDrafts())
  }

  // ── 削除 ──
  function handleDeleteDraft(id: string) {
    if (!window.confirm('このLINE活用案を削除しますか？')) return
    deleteLineDraft(id)
    setSavedLineDrafts(getLineDrafts())
  }

  // ── 複製 ──
  function handleDuplicateLine(lineDraft: LineStrategyDraft) {
    const now = new Date().toISOString()
    const copy: LineStrategyDraft = {
      ...lineDraft,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'draft',
      usageStatus: 'unused',
      generatedAt: now,
      updatedAt: now,
    }
    saveLineDraft(copy)
    setSavedLineDrafts(getLineDrafts())
  }

  function handleUpdateStatusLine(id: string, status: UsageStatus) {
    updateLineDraft(id, { usageStatus: status })
    setSavedLineDrafts(getLineDrafts())
  }

  // ── 再編集 ──
  function handleReedit(lineDraft: LineStrategyDraft) {
    setSelectedPersonaId(lineDraft.personaId)
    setSelectedContentId(lineDraft.referencedContentId ?? null)
    setSelectedLpId(lineDraft.referencedLpId ?? null)
    setSelectedGoal(lineDraft.goal)
    setSections(lineDraft.sections)
    setLineRegistrationUrl(lineDraft.lineRegistrationUrl)
    setRecommendedChannels(lineDraft.recommendedChannels)
    setSnsCtaText(lineDraft.snsCtaText)
    setCurrentDraft(lineDraft)
    setIsSaved(true)
    setExpandedKeys(new Set(['line_register_copy', 'greeting_message', 'message_1']))
    setTimeout(() => {
      document.getElementById('line-editor')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ── 全文コピー ──
  function handleCopyAll() {
    const text = sections
      .map((s) => `【${s.label}】\n${s.content}`)
      .join('\n\n─────\n\n')
    navigator.clipboard.writeText(text).catch(() => {})
  }

  const filteredContents = selectedPersonaId
    ? contentDrafts.filter((c) => c.personaId === selectedPersonaId)
    : contentDrafts
  const filteredLps = selectedPersonaId
    ? lpDrafts.filter((l) => l.personaId === selectedPersonaId)
    : lpDrafts

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">LINE活用支援</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">リピーター</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">集客</span>
        </div>
        <p className="text-sm text-slate-500">
          ペルソナとLINE目的を選ぶと、登録導線・特典・あいさつ・ステップ配信案を生成します
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
                <p className="text-xs text-slate-500 truncate">{p.sourceName}</p>
                {selectedPersonaId === p.id && (
                  <div className="mt-2 space-y-0.5">
                    {p.pains[0] && <p className="text-xs text-slate-500">悩み：{p.pains[0].slice(0, 30)}</p>}
                    {p.desires[0] && <p className="text-xs text-slate-500">欲求：{p.desires[0].slice(0, 30)}</p>}
                    {p.resonantPhrases[0] && <p className="text-xs text-indigo-600">刺さる言葉：{p.resonantPhrases[0].slice(0, 30)}</p>}
                    {p.usedChannels.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {p.usedChannels.map((ch, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{ch}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* コンテンツ参照（任意） */}
        <StepLabel n={2} label="保存済みコンテンツ・LP案を参照する（任意）" />
        <p className="text-xs text-slate-400 mb-3">
          保存済みのコンテンツまたはLP案を選ぶと、LINE誘導文・強み・CTAを生成に活用します
        </p>

        {/* コンテンツ */}
        {filteredContents.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-500 mb-2">コンテンツ</p>
            <div className="space-y-1.5">
              {filteredContents.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContentId(selectedContentId === c.id ? null : c.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                    selectedContentId === c.id
                      ? 'bg-indigo-50 border-indigo-400'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700">{CONTENT_TYPE_LABEL[c.contentType]}</span>
                    <span className="text-xs text-slate-400 truncate flex-1">{c.content.slice(0, 40)}</span>
                    {selectedContentId === c.id && <span className="text-xs text-indigo-600 font-semibold flex-shrink-0">参照中</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LP案 */}
        {filteredLps.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 mb-2">LP案（LINE登録URLがあれば自動引き継ぎ）</p>
            <div className="space-y-1.5">
              {filteredLps.slice(0, 3).map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedLpId(selectedLpId === l.id ? null : l.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border transition-all ${
                    selectedLpId === l.id
                      ? 'bg-purple-50 border-purple-400'
                      : 'bg-slate-50 border-slate-200 hover:border-purple-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-700">{LP_GOAL_LABEL[l.goal] || l.goalLabel}</span>
                    <span className="text-xs text-slate-400 flex-1 truncate">
                      {l.sections[0]?.content.split('\n')[0].slice(0, 40)}
                    </span>
                    {selectedLpId === l.id && <span className="text-xs text-purple-600 font-semibold flex-shrink-0">参照中</span>}
                  </div>
                  {selectedLpId === l.id && l.lineRegistrationUrl && (
                    <p className="text-xs text-purple-600 mt-0.5">LINE URL: {l.lineRegistrationUrl}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {(filteredContents.length === 0 && filteredLps.length === 0) && (
          <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl mb-6">
            <p className="text-xs text-slate-400">保存済みコンテンツ・LP案がありません（スキップ可）</p>
          </div>
        )}

        {/* LINE目的選択 */}
        <StepLabel n={3} label="LINE活用の目的を選ぶ" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
          {ALL_LINE_GOALS.map((goal) => {
            const cfg = LINE_GOAL_CONFIG[goal]
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            ? 'ペルソナとLINE目的を選択してください'
            : 'LINE活用案を生成する'}
        </button>
      </div>

      {/* ─── LINE エディタ ─── */}
      {sections.length > 0 && currentDraft && (
        <div id="line-editor">
          {/* AI免責 */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">!</span>
            <p className="text-xs text-amber-700">
              AIの提案です。各セクションを確認・編集してから保存してください。最終的な文章の判断はあなたが行います。
            </p>
          </div>

          {/* 情報ヘッダー */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${LINE_GOAL_CONFIG[currentDraft.goal].phaseColor}`}>
                {LINE_GOAL_CONFIG[currentDraft.goal].phaseLabel}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {LINE_GOAL_CONFIG[currentDraft.goal].label}
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

          {/* LINE登録URL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-3">
            <p className="text-xs font-semibold text-slate-500 mb-2">LINE登録URL（各配信文で使用）</p>
            <input
              type="text"
              value={lineRegistrationUrl}
              onChange={(e) => { setLineRegistrationUrl(e.target.value); setIsSaved(false) }}
              placeholder="https://lin.ee/xxxxxxx"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {/* セクションエディタ */}
          <div className="space-y-3 mb-4">
            {sections.map((section, idx) => {
              const isExpanded = expandedKeys.has(section.key)
              const sk = LINE_SECTION_KEYS[idx]
              const isMessage = ['message_1', 'message_2', 'message_3', 'greeting_message'].includes(section.key)

              return (
                <div
                  key={section.key}
                  className={`bg-white rounded-2xl border overflow-hidden ${
                    isMessage ? 'border-green-200' : 'border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => toggleExpanded(section.key)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                        isMessage ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>
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
                      {isMessage && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                          配信文
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <p className="text-xs text-slate-400 mb-2">{sk?.hint}</p>
                      {/* LINEメッセージ風プレビュー（配信文のみ） */}
                      {isMessage && (
                        <div className="mb-3 bg-[#06c755]/10 rounded-xl p-3 border border-[#06c755]/20">
                          <p className="text-xs font-medium text-[#06c755] mb-1.5">LINE配信文プレビュー</p>
                          <div className="bg-white rounded-lg px-3 py-2 shadow-sm max-w-xs">
                            <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                              {section.content.slice(0, 120)}{section.content.length > 120 ? '…' : ''}
                            </pre>
                          </div>
                        </div>
                      )}
                      <textarea
                        rows={section.content.split('\n').length + 2}
                        value={section.content}
                        onChange={(e) => updateSection(section.key, e.target.value)}
                        className="w-full text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono bg-slate-50"
                      />
                      <p className="text-xs text-slate-400 mt-1 text-right">{section.content.length}文字</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* SNS戦略引き継ぎ設定 */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                SNS戦略への引き継ぎ
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-700 mb-1.5">
                  LINE誘導におすすめのSNSチャネル
                </p>
                <div className="flex gap-2 flex-wrap">
                  {recommendedChannels.map((ch, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700 mb-1.5">
                  SNS投稿でのLINE誘導文言
                </p>
                <textarea
                  rows={4}
                  value={snsCtaText}
                  onChange={(e) => { setSnsCtaText(e.target.value); setIsSaved(false) }}
                  className="w-full text-sm border border-blue-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-y"
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
            {isSaved ? 'LINE活用案を保存済み ✓' : 'このLINE活用案を保存する'}
          </button>
          {isSaved && (
            <p className="text-center text-xs text-slate-400 mt-2">
              保存しました。下の「保存済みLINE活用案」に追加されています。
            </p>
          )}
        </div>
      )}

      {/* ─── 保存済み一覧 ─── */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">保存済みLINE活用案</h2>
          <span className="text-sm text-slate-400">{savedLineDrafts.length}件</span>
        </div>

        {savedLineDrafts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">まだ保存済みLINE活用案がありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedLineDrafts.map((lineDraft) => {
              const cfg = LINE_GOAL_CONFIG[lineDraft.goal]
              const registerSection = lineDraft.sections.find((s) => s.key === 'line_register_copy')
              const isExpanded = expandedDraftId === lineDraft.id

              return (
                <div key={lineDraft.id} className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.phaseColor}`}>
                          {cfg.phaseLabel}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{cfg.label}</span>
                        <UsageStatusBadge status={lineDraft.usageStatus} onChange={(s) => handleUpdateStatusLine(lineDraft.id, s)} />
                        <span className="text-xs text-slate-400">/ {lineDraft.personaName}</span>
                      </div>
                      {registerSection && (
                        <p className="text-xs text-slate-500 truncate">
                          {registerSection.content.split('\n')[0].slice(0, 60)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <a
                          href={`/personas/${lineDraft.personaId}/edit`}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {lineDraft.personaName} →
                        </a>
                        <span className="text-slate-300">|</span>
                        <a
                          href={lineDraft.sourceType === 'brand' ? '/brand' : lineDraft.sourceType === 'artwork' ? `/artworks/${lineDraft.sourceId}/edit` : `/workshops/${lineDraft.sourceId}/edit`}
                          className="text-xs text-slate-500 hover:underline"
                        >
                          {lineDraft.sourceName} →
                        </a>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {lineDraft.referencedContentName && (
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                            参照コンテンツ：{lineDraft.referencedContentName}
                          </span>
                        )}
                        {lineDraft.referencedLpName && (
                          <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                            参照LP：{lineDraft.referencedLpName}
                          </span>
                        )}
                      </div>
                      {lineDraft.lineRegistrationUrl && (
                        <p className="text-xs text-green-600 mt-0.5">LINE URL: {lineDraft.lineRegistrationUrl}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-1.5">
                      <button
                        onClick={() => handleReedit(lineDraft)}
                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDuplicateLine(lineDraft)}
                        className="text-xs px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg font-medium transition-colors"
                      >
                        複製
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(lineDraft.id)}
                        className="text-xs px-3 py-1.5 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-lg font-medium transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedDraftId(isExpanded ? null : lineDraft.id)}
                    className="mt-2 text-xs text-slate-400 hover:text-indigo-600 underline"
                  >
                    {isExpanded ? '折り畳む' : '全セクションを見る'}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {lineDraft.sections.map((s) => (
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
                      {lineDraft.snsCtaText && (
                        <div className="border-l-2 border-blue-200 pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-blue-500">SNS誘導文言（SNS戦略引き継ぎ）</p>
                            <CopyButton text={lineDraft.snsCtaText} />
                          </div>
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                            {lineDraft.snsCtaText}
                          </pre>
                          <div className="flex gap-1 mt-1">
                            {lineDraft.recommendedChannels.map((ch, i) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{ch}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* SNS戦略への接続案内 */}
        {savedLineDrafts.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-blue-900 mb-1">次のステップ：SNS戦略</p>
            <p className="text-xs text-blue-700 mb-3">
              保存したLINE活用案の「SNS誘導文言」・おすすめチャネルをもとに、SNS戦略画面で媒体別の投稿方針・週間投稿案を作成できます
            </p>
            <a href="/sns-strategy" className="inline-block text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
              SNS戦略へ →
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
