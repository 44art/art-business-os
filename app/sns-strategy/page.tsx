'use client'

import { useState, useEffect } from 'react'
import type {
  Persona,
  Brand,
  Artwork,
  Workshop,
  ContentDraft,
  LandingPageDraft,
  LineStrategyDraft,
  SnsStrategyGoal,
  SnsStrategyPlatform,
  SnsStrategyDraft,
  UsageStatus,
} from '@/types'
import {
  getPersonas,
  getBrand,
  getArtworks,
  getWorkshops,
  getContentDrafts,
  getLpDrafts,
  getLineDrafts,
  getSnsDrafts,
  saveSnsDraft,
  updateSnsDraft,
  deleteSnsDraft,
} from '@/lib/storage'
import { generateSnsSections, SNS_GOAL_CONFIG, SNS_PLATFORM_CONFIG, SNS_SECTION_KEYS } from '@/lib/sns'
import { CopyButton } from '@/components/CopyButton'
import { UsageStatusBadge } from '@/components/UsageStatusBadge'

// ─── 型・定数 ─────────────────────────────────────────────

type Source = Brand | Artwork | Workshop

const GOALS: SnsStrategyGoal[] = ['awareness', 'ws_booking', 'artwork_sales', 'line_register', 'fan', 'repeat']
const PLATFORMS: SnsStrategyPlatform[] = ['x', 'instagram', 'facebook', 'youtube', 'tiktok', 'threads']

const PHASE_COLOR: Record<string, string> = {
  awareness:   'bg-blue-100 text-blue-800',
  acquisition: 'bg-yellow-100 text-yellow-800',
  sales:       'bg-green-100 text-green-800',
  retention:   'bg-purple-100 text-purple-800',
}

const PHASE_LABEL: Record<string, string> = {
  awareness: '認知', acquisition: '集客', sales: '販売', retention: '継続',
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  sns_post: 'SNS投稿', ws_announce: 'WS告知文',
  artwork_sales: '作品販売文', line_message: 'LINE配信文', lp_intro: 'LP導入文',
}

const LP_GOAL_LABEL: Record<string, string> = {
  artwork_sales: '作品販売LP', ws_booking: 'WS予約LP',
  inquiry: '問い合わせLP', line_register: 'LINE登録LP', awareness: '認知拡大LP',
}

const LINE_GOAL_LABEL: Record<string, string> = {
  ws_booking: 'WS予約LINE', artwork_sales: '作品販売LINE',
  inquiry: '問い合わせLINE', repeat: 'リピーターLINE', fan: 'ファン化LINE',
}

// ─── ユーティリティ ───────────────────────────────────────

function makeId() {
  return `sns_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })
}

function sourceLabel(sourceType: string) {
  return sourceType === 'brand' ? 'ブランド' : sourceType === 'artwork' ? '作品' : 'WS'
}

// ─── コンポーネント ───────────────────────────────────────

export default function SnsStrategyPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([])
  const [lpDrafts, setLpDrafts] = useState<LandingPageDraft[]>([])
  const [lineDrafts, setLineDrafts] = useState<LineStrategyDraft[]>([])
  const [snsDrafts, setSnsDrafts] = useState<SnsStrategyDraft[]>([])

  // 選択状態
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('')
  const [expandedPersonaId, setExpandedPersonaId] = useState<string>('')
  const [selectedContentId, setSelectedContentId] = useState<string>('')
  const [selectedLpId, setSelectedLpId] = useState<string>('')
  const [selectedLineId, setSelectedLineId] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<SnsStrategyGoal | ''>('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SnsStrategyPlatform[]>([])

  // 生成結果
  const [generated, setGenerated] = useState<SnsStrategyDraft | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // 保存済み一覧の展開
  const [expandedDraftId, setExpandedDraftId] = useState<string>('')

  // 保存完了メッセージ
  const [savedMsg, setSavedMsg] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // ロード
  useEffect(() => {
    setPersonas(getPersonas())
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
    setContentDrafts(getContentDrafts())
    setLpDrafts(getLpDrafts())
    setLineDrafts(getLineDrafts())
    setSnsDrafts(getSnsDrafts())
  }, [])

  // ─── 素材解決 ─────────────────────────────────────────

  function resolveSource(persona: Persona): Source | null {
    if (persona.sourceType === 'brand') return brand
    if (persona.sourceType === 'artwork') return artworks.find((a) => a.id === persona.sourceId) ?? null
    return workshops.find((w) => w.id === persona.sourceId) ?? null
  }

  // ─── 生成 ─────────────────────────────────────────────

  function handleGenerate() {
    if (!selectedPersonaId || !selectedGoal || selectedPlatforms.length === 0) return
    const persona = personas.find((p) => p.id === selectedPersonaId)
    if (!persona) return
    const source = resolveSource(persona)
    if (!source) return

    setIsGenerating(true)
    setTimeout(() => {
      const referencedContent = contentDrafts.find((c) => c.id === selectedContentId) ?? null
      const referencedLp = lpDrafts.find((l) => l.id === selectedLpId) ?? null
      const referencedLine = lineDrafts.find((l) => l.id === selectedLineId) ?? null

      const { sections, weeklyPostCount, primaryCta, marketingPhaseLink } = generateSnsSections({
        goal: selectedGoal,
        platforms: selectedPlatforms,
        persona,
        source,
        referencedContent,
        referencedLp,
        referencedLine,
      })

      const now = new Date().toISOString()
      const draft: SnsStrategyDraft = {
        id: makeId(),
        personaId: persona.id,
        personaName: persona.name,
        sourceType: persona.sourceType,
        sourceId: persona.sourceId,
        sourceName: persona.sourceName,
        referencedContentId: selectedContentId || undefined,
        referencedContentName: referencedContent
          ? (CONTENT_TYPE_LABEL[referencedContent.contentType] ?? undefined)
          : undefined,
        referencedLpId: selectedLpId || undefined,
        referencedLpName: referencedLp
          ? (LP_GOAL_LABEL[referencedLp.goal] ?? referencedLp.goalLabel)
          : undefined,
        referencedLineId: selectedLineId || undefined,
        referencedLineName: referencedLine
          ? (LINE_GOAL_LABEL[referencedLine.goal] ?? referencedLine.goalLabel)
          : undefined,
        goal: selectedGoal,
        goalLabel: SNS_GOAL_CONFIG[selectedGoal].label,
        platforms: selectedPlatforms,
        sections,
        marketingPhaseLink,
        weeklyPostCount,
        primaryCta,
        status: 'draft',
        generatedAt: now,
        updatedAt: now,
      }
      setGenerated(draft)
      const allOpen: Record<string, boolean> = {}
      SNS_SECTION_KEYS.forEach((k) => { allOpen[k] = true })
      setExpandedSections(allOpen)
      setIsGenerating(false)
    }, 300)
  }

  // ─── セクション編集 ───────────────────────────────────

  function updateSection(key: string, content: string) {
    if (!generated) return
    setGenerated({
      ...generated,
      sections: generated.sections.map((s) =>
        s.key === key ? { ...s, content } : s
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  // ─── 保存 ────────────────────────────────────────────

  function handleSave() {
    if (!generated) return
    const toSave: SnsStrategyDraft = {
      ...generated,
      status: 'saved',
      updatedAt: new Date().toISOString(),
    }
    const existing = snsDrafts.find((d) => d.id === generated.id)
    if (existing) {
      updateSnsDraft(toSave.id, toSave)
      setSnsDrafts(getSnsDrafts())
    } else {
      saveSnsDraft(toSave)
      setSnsDrafts(getSnsDrafts())
    }
    setGenerated(toSave)
    setSavedMsg('保存しました')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  // ─── 再編集 ──────────────────────────────────────────

  function handleReedit(draft: SnsStrategyDraft) {
    setSelectedPersonaId(draft.personaId)
    setSelectedGoal(draft.goal)
    setSelectedPlatforms(draft.platforms)
    setSelectedContentId(draft.referencedContentId ?? '')
    setSelectedLpId(draft.referencedLpId ?? '')
    setSelectedLineId(draft.referencedLineId ?? '')
    setGenerated(draft)
    const allOpen: Record<string, boolean> = {}
    SNS_SECTION_KEYS.forEach((k) => { allOpen[k] = true })
    setExpandedSections(allOpen)
    setTimeout(() => {
      document.getElementById('sns-editor')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ─── 複製 ─────────────────────────────────────────────

  function handleDuplicate(draft: SnsStrategyDraft) {
    const now = new Date().toISOString()
    const copy: SnsStrategyDraft = {
      ...draft,
      id: makeId(),
      status: 'draft',
      usageStatus: 'unused',
      generatedAt: now,
      updatedAt: now,
    }
    saveSnsDraft(copy)
    setSnsDrafts(getSnsDrafts())
  }

  function handleUpdateStatusSns(id: string, status: UsageStatus) {
    updateSnsDraft(id, { usageStatus: status })
    setSnsDrafts(getSnsDrafts())
  }

  // ─── 削除 ────────────────────────────────────────────

  function handleDelete(id: string) {
    if (!confirm('この戦略案を削除しますか？')) return
    deleteSnsDraft(id)
    setSnsDrafts(getSnsDrafts())
    if (generated?.id === id) setGenerated(null)
  }

  // ─── プラットフォーム選択トグル ──────────────────────

  function togglePlatform(p: SnsStrategyPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    )
  }

  // ─── 描画 ─────────────────────────────────────────────

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId)
  const filteredLpDrafts = lpDrafts.filter((l) =>
    !selectedPersonaId || l.personaId === selectedPersonaId
  )
  const filteredLineDrafts = lineDrafts.filter((l) =>
    !selectedPersonaId || l.personaId === selectedPersonaId
  )
  const filteredContentDrafts = contentDrafts.filter((c) =>
    !selectedPersonaId || c.personaId === selectedPersonaId
  )
  const canGenerate = !!selectedPersonaId && !!selectedGoal && selectedPlatforms.length > 0

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">認知・集客</span>
          <h1 className="text-2xl font-bold text-slate-900">SNS戦略</h1>
        </div>
        <p className="text-sm text-slate-500">
          ペルソナ・目的・媒体を選んで、SNS発信の戦略案をAIが生成します。
          コンテンツ案・LP案・LINE戦略を参照することでより具体的な戦略を作成できます。
        </p>
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs text-slate-600 space-y-1">
          <p><span className="font-semibold">目的の選び方：</span>「認知拡大」はフォロワー増加、「WS集客」は申込増加、「作品販売」は購入促進など、今一番伸ばしたいゴールを選びます。</p>
          <p><span className="font-semibold">生成結果の使い方：</span>投稿テーマ・コンテンツアイデア・ハッシュタグ・投稿文サンプルが生成されます。投稿文はたたき台なので自分の口調・言葉にアレンジして使ってください。</p>
        </div>
      </div>

      {/* STEP 1: ペルソナ選択 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">STEP 1 ペルソナを選択</h2>
        {personas.length === 0 ? (
          <SnsPrerequisiteGate hasSources={!!(brand || artworks.length > 0 || workshops.length > 0)} />
        ) : (
          <div className="grid gap-2">
            {personas.map((p) => (
              <div
                key={p.id}
                className={`border rounded-lg cursor-pointer transition-colors ${
                  selectedPersonaId === p.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div
                  className="flex items-center justify-between p-3"
                  onClick={() => {
                    setSelectedPersonaId(p.id)
                    setSelectedContentId('')
                    setSelectedLpId('')
                    setSelectedLineId('')
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                      selectedPersonaId === p.id ? 'border-blue-500 bg-blue-500' : 'border-slate-400'
                    }`} />
                    <div>
                      <p className="font-medium text-sm text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.age} · {p.occupation} · {sourceLabel(p.sourceType)}: {p.sourceName}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedPersonaId(expandedPersonaId === p.id ? '' : p.id)
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2"
                  >
                    {expandedPersonaId === p.id ? '▲ 閉じる' : '▼ 詳細'}
                  </button>
                </div>
                {expandedPersonaId === p.id && (
                  <div className="px-4 pb-3 border-t border-slate-100 mt-1 space-y-2">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mt-2">悩み</p>
                      <ul className="text-xs text-slate-600 list-disc list-inside">{p.pains.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">理想・欲求</p>
                      <ul className="text-xs text-slate-600 list-disc list-inside">{p.desires.map((x, i) => <li key={i}>{x}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">刺さる言葉</p>
                      <div className="flex flex-wrap gap-1">{p.resonantPhrases.map((x, i) => <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{x}</span>)}</div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600">よく使うチャネル</p>
                      <div className="flex flex-wrap gap-1">{p.usedChannels.map((x, i) => <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{x}</span>)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* STEP 2: 参照データ（任意） */}
      {selectedPersona && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-1">STEP 2 参照データを選択（任意）</h2>
          <p className="text-xs text-slate-400 mb-3">
            コンテンツ案・LP案・LINE戦略を選ぶと、SNS戦略の内容がより具体的になります
          </p>

          {/* コンテンツ参照 */}
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 block mb-1">コンテンツ案を参照（任意）</label>
            <select
              value={selectedContentId}
              onChange={(e) => setSelectedContentId(e.target.value)}
              className="w-full border border-slate-200 rounded-md text-sm px-3 py-2 text-slate-700 bg-white"
            >
              <option value="">参照しない</option>
              {filteredContentDrafts.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.contentType}] {c.sourceName} — {c.content.slice(0, 40)}…
                </option>
              ))}
            </select>
          </div>

          {/* LP参照 */}
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 block mb-1">LP案を参照（任意）</label>
            <select
              value={selectedLpId}
              onChange={(e) => setSelectedLpId(e.target.value)}
              className="w-full border border-slate-200 rounded-md text-sm px-3 py-2 text-slate-700 bg-white"
            >
              <option value="">参照しない</option>
              {filteredLpDrafts.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.goalLabel}] {l.sourceName} — {fmtDate(l.generatedAt)}
                </option>
              ))}
            </select>
            {selectedLpId && (
              <p className="text-xs text-blue-600 mt-1">
                LINE URL「{lpDrafts.find((l) => l.id === selectedLpId)?.lineRegistrationUrl || '未設定'}」が引き継がれます
              </p>
            )}
          </div>

          {/* LINE戦略参照 */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">LINE戦略案を参照（任意）</label>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="w-full border border-slate-200 rounded-md text-sm px-3 py-2 text-slate-700 bg-white"
            >
              <option value="">参照しない</option>
              {filteredLineDrafts.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.goalLabel}] {l.sourceName} — {fmtDate(l.generatedAt)}
                </option>
              ))}
            </select>
            {selectedLineId && (() => {
              const ld = lineDrafts.find((l) => l.id === selectedLineId)
              return ld ? (
                <div className="mt-1 text-xs text-green-700 bg-green-50 rounded px-2 py-1 space-y-0.5">
                  <p>推奨SNSチャネル: {ld.recommendedChannels.join('・')}</p>
                  {ld.snsCtaText && <p>SNS CTA引き継ぎ: 「{ld.snsCtaText}」</p>}
                </div>
              ) : null
            })()}
          </div>
        </section>
      )}

      {/* STEP 3: SNS目的選択 */}
      {selectedPersona && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">STEP 3 SNS目的を選択</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {GOALS.map((goal) => {
              const cfg = SNS_GOAL_CONFIG[goal]
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setSelectedGoal(goal)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedGoal === goal
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-medium text-sm text-slate-900">{cfg.label}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PHASE_COLOR[cfg.phase]}`}>
                    {PHASE_LABEL[cfg.phase]}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* STEP 4: 媒体選択（複数可） */}
      {selectedPersona && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-1">STEP 4 使用するSNS媒体を選択（複数可）</h2>
          <p className="text-xs text-slate-400 mb-3">
            ペルソナがよく使うチャネル:
            <span className="text-blue-600 font-medium ml-1">{selectedPersona.usedChannels.join('・')}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLATFORMS.map((platform) => {
              const cfg = SNS_PLATFORM_CONFIG[platform]
              const isSelected = selectedPlatforms.includes(platform)
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-400'
                    }`}>
                      {isSelected && <span className="text-white text-xs leading-none">✓</span>}
                    </span>
                    <p className="font-medium text-sm text-slate-900">{cfg.label}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-6">{cfg.primaryUse}</p>
                </button>
              )
            })}
          </div>
          {selectedPlatforms.length > 0 && (
            <p className="text-xs text-blue-600 mt-2">
              選択中: {selectedPlatforms.map((p) => SNS_PLATFORM_CONFIG[p].label).join('・')}
            </p>
          )}
        </section>
      )}

      {/* 生成ボタン */}
      {selectedPersona && (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={!canGenerate || isGenerating}
            onClick={handleGenerate}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isGenerating ? '生成中…' : 'SNS戦略案を生成する'}
          </button>
        </div>
      )}

      {/* 生成結果 */}
      {generated && (
        <section id="sns-editor" className="space-y-4">
          {/* AI免責 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700">
              AIの提案です。各セクションを確認・編集してから保存してください。最終的な戦略の判断はあなたが行います。
            </p>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-lg">SNS戦略案</h2>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                    {generated.goalLabel}
                  </span>
                  {generated.platforms.map((p) => (
                    <span key={p} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {SNS_PLATFORM_CONFIG[p].label}
                    </span>
                  ))}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_COLOR[generated.marketingPhaseLink]}`}>
                    {PHASE_LABEL[generated.marketingPhaseLink]}フェーズ
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p>週間投稿目安: <span className="font-semibold text-slate-700">{generated.weeklyPostCount}件</span></p>
                <p className="mt-0.5">主要CTA: <span className="text-slate-700">{generated.primaryCta}</span></p>
              </div>
            </div>

            {/* コンテキスト */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-xs">
              <div className="bg-slate-50 rounded p-2">
                <p className="text-slate-400 mb-0.5">ペルソナ</p>
                <p className="font-medium text-slate-700">{generated.personaName}</p>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <p className="text-slate-400 mb-0.5">素材</p>
                <p className="font-medium text-slate-700">{sourceLabel(generated.sourceType)}: {generated.sourceName}</p>
              </div>
              {generated.referencedLineId && (
                <div className="bg-green-50 rounded p-2">
                  <p className="text-green-600 mb-0.5">LINE戦略参照</p>
                  <p className="font-medium text-green-700">引き継ぎ済み</p>
                </div>
              )}
            </div>

            {/* セクション展開/折りたたみ */}
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => {
                  const allOpen = Object.values(expandedSections).every(Boolean)
                  const next: Record<string, boolean> = {}
                  SNS_SECTION_KEYS.forEach((k) => { next[k] = !allOpen })
                  setExpandedSections(next)
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                {Object.values(expandedSections).every(Boolean) ? 'すべて折りたたむ' : 'すべて展開'}
              </button>
            </div>

            {/* 8セクション */}
            <div className="space-y-3">
              {generated.sections.map((section) => (
                <div key={section.key} className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSections((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                    }
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-left"
                  >
                    <span className="font-medium text-sm text-slate-800">{section.label}</span>
                    <span className="text-slate-400 text-xs">{expandedSections[section.key] ? '▲' : '▼'}</span>
                  </button>
                  {expandedSections[section.key] && (
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-slate-400">{section.hint}</p>
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.key, e.target.value)}
                        rows={section.content.split('\n').length + 2}
                        className="w-full border border-slate-200 rounded-md text-xs px-3 py-2 text-slate-800 font-mono leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AIコンサルタント引き継ぎ */}
            <div className="mt-4 border border-purple-200 rounded-lg p-3 bg-purple-50">
              <p className="text-xs font-semibold text-purple-700 mb-1">AIコンサルタント引き継ぎデータ</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-purple-400">マーケティングフェーズ</p>
                  <p className="font-medium text-purple-800">{PHASE_LABEL[generated.marketingPhaseLink]}（{generated.marketingPhaseLink}）</p>
                </div>
                <div>
                  <p className="text-purple-400">週間投稿数（目安）</p>
                  <p className="font-medium text-purple-800">{generated.weeklyPostCount}件 / 週</p>
                </div>
                <div>
                  <p className="text-purple-400">主要CTA</p>
                  <p className="font-medium text-purple-800">{generated.primaryCta}</p>
                </div>
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                保存する
              </button>
              {savedMsg && (
                <span className="text-sm text-green-600 font-medium">{savedMsg}</span>
              )}
              {generated.status === 'saved' && !savedMsg && (
                <span className="text-xs text-slate-400">保存済み</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 保存済み一覧 */}
      {snsDrafts.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">保存済みSNS戦略案（{snsDrafts.length}件）</h2>
          <div className="space-y-2">
            {snsDrafts.map((draft) => (
              <div key={draft.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHASE_COLOR[draft.marketingPhaseLink]}`}>
                      {PHASE_LABEL[draft.marketingPhaseLink]}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{draft.goalLabel}</span>
                    <UsageStatusBadge status={draft.usageStatus} onChange={(s) => handleUpdateStatusSns(draft.id, s)} />
                    {draft.platforms.map((p) => (
                      <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {SNS_PLATFORM_CONFIG[p].label}
                      </span>
                    ))}
                    <a
                      href={`/personas/${draft.personaId}/edit`}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      {draft.personaName} →
                    </a>
                    <a
                      href={draft.sourceType === 'brand' ? '/brand' : draft.sourceType === 'artwork' ? `/artworks/${draft.sourceId}/edit` : `/workshops/${draft.sourceId}/edit`}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      {draft.sourceName} →
                    </a>
                    {draft.referencedContentName && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                        {draft.referencedContentName}
                      </span>
                    )}
                    {draft.referencedLpName && (
                      <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">
                        {draft.referencedLpName}
                      </span>
                    )}
                    {draft.referencedLineName && (
                      <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">
                        {draft.referencedLineName}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{fmtDate(draft.updatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleReedit(draft)}
                      className="text-xs text-indigo-600 hover:underline font-medium"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(draft)}
                      className="text-xs text-slate-600 hover:underline"
                    >
                      複製
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedDraftId(expandedDraftId === draft.id ? '' : draft.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {expandedDraftId === draft.id ? '閉じる' : '詳細'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(draft.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {expandedDraftId === draft.id && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-3">
                    {/* 引き継ぎデータ */}
                    <div className="bg-purple-50 rounded p-2 text-xs space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-purple-400">フェーズ</p>
                          <p className="font-medium text-purple-700">{PHASE_LABEL[draft.marketingPhaseLink]}</p>
                        </div>
                        <div>
                          <p className="text-purple-400">週間投稿</p>
                          <p className="font-medium text-purple-700">{draft.weeklyPostCount}件</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-purple-400">主要CTA</p>
                          <CopyButton text={draft.primaryCta} />
                        </div>
                        <p className="font-medium text-purple-700 mt-0.5">{draft.primaryCta}</p>
                      </div>
                    </div>
                    {/* 全セクション */}
                    {draft.sections.map((section) => (
                      <div key={section.key} className="text-xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-medium text-slate-700">{section.label}</p>
                          <CopyButton text={section.content} />
                        </div>
                        <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 rounded p-2 leading-relaxed">{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 次のステップ */}
      {snsDrafts.length > 0 && (
        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-purple-900 mb-1">次のステップ：AIコンサルタント診断</p>
          <p className="text-xs text-purple-700 mb-3">
            SNS戦略まで作成できました。AIコンサルタントに全導線を診断してもらい、最優先の改善アクションを確認しましょう。
          </p>
          <a
            href="/consultant"
            className="inline-block text-xs font-medium px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            AIコンサルタント診断へ →
          </a>
        </div>
      )}
    </div>
  )
}

function SnsPrerequisiteGate({ hasSources }: { hasSources: boolean }) {
  if (!hasSources) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-amber-900 mb-1">まず素材を登録してください</p>
        <p className="text-xs text-amber-700 mb-3">
          SNS戦略生成には「素材登録 → ペルソナ作成」の順で準備が必要です。
          ブランド・作品・WSのいずれかを登録してから、ペルソナを作成してください。
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/brand" className="text-xs font-medium px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">ブランドを登録 →</a>
          <a href="/artworks/new" className="text-xs font-medium px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">作品を登録 →</a>
          <a href="/workshops/new" className="text-xs font-medium px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">WSを登録 →</a>
        </div>
      </div>
    )
  }
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
      <p className="text-sm font-semibold text-blue-900 mb-1">ペルソナを作成してください</p>
      <p className="text-xs text-blue-700 mb-3">
        素材の登録が確認できました。次に「ペルソナ」を作成するとSNS戦略生成が使えるようになります。
        AIマーケティング分析からペルソナを自動生成することもできます。
      </p>
      <div className="flex flex-wrap gap-2">
        <a href="/personas/new" className="text-xs font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">ペルソナを作成 →</a>
        <a href="/analysis" className="text-xs font-medium px-3 py-1.5 bg-white text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">AI分析からペルソナを生成 →</a>
      </div>
    </div>
  )
}
