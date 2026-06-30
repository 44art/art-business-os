'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Persona, Brand, Artwork, Workshop, ContentDraft, ContentType } from '@/types'
import {
  getBrand, getArtworks, getWorkshops, getPersonas,
  getContentDrafts, saveContentDraft, deleteContentDraft,
} from '@/lib/storage'
import { generateContentDraft, CONTENT_TYPE_CONFIG } from '@/lib/content'

// ─── 定数 ──────────────────────────────────────────────────

const ALL_CONTENT_TYPES = Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]

const SOURCE_TYPE_LABEL: Record<string, string> = {
  brand: 'ブランド', artwork: '作品', workshop: 'WS',
}
const SOURCE_TYPE_COLOR: Record<string, string> = {
  brand: 'bg-indigo-100 text-indigo-700',
  artwork: 'bg-amber-100 text-amber-700',
  workshop: 'bg-green-100 text-green-700',
}
const PHASE_LABEL: Record<string, string> = {
  awareness: '認知', acquisition: '集客', sales: '販売', retention: 'リピーター',
}
const PHASE_COLOR: Record<string, string> = {
  awareness: 'bg-blue-100 text-blue-800',
  acquisition: 'bg-green-100 text-green-800',
  sales: 'bg-amber-100 text-amber-800',
  retention: 'bg-purple-100 text-purple-800',
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── メインページ ───────────────────────────────────────────

export default function ContentPage() {
  // マスターデータ
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [savedDrafts, setSavedDrafts] = useState<ContentDraft[]>([])

  // 生成フォーム state
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [generatedDraft, setGeneratedDraft] = useState<ContentDraft | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingHashtags, setEditingHashtags] = useState<string[]>([])
  const [isSaved, setIsSaved] = useState(false)

  // 保存済み一覧フィルタ
  const [filterPhase, setFilterPhase] = useState<string | null>(null)

  const loadAll = useCallback(() => {
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
    setPersonas(getPersonas())
    setSavedDrafts(getContentDrafts())
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ── ソースデータ取得 ──
  function getSourceForPersona(persona: Persona): Brand | Artwork | Workshop | null {
    if (persona.sourceType === 'brand') return brand
    if (persona.sourceType === 'artwork') return artworks.find((a) => a.id === persona.sourceId) ?? null
    return workshops.find((w) => w.id === persona.sourceId) ?? null
  }

  // ── 生成実行 ──
  function handleGenerate() {
    if (!selectedPersonaId || !selectedContentType) return
    const persona = personas.find((p) => p.id === selectedPersonaId)
    if (!persona) return
    const source = getSourceForPersona(persona)

    const output = generateContentDraft({
      contentType: selectedContentType,
      persona,
      source,
    })

    const now = new Date().toISOString()
    const draft: ContentDraft = {
      id: generateId(),
      personaId: persona.id,
      personaName: persona.name,
      sourceType: persona.sourceType,
      sourceId: persona.sourceId,
      sourceName: persona.sourceName,
      status: 'draft',
      generatedAt: now,
      updatedAt: now,
      ...output,
    }
    setGeneratedDraft(draft)
    setEditingContent(output.content)
    setEditingHashtags(output.hashtags)
    setIsSaved(false)
    setTimeout(() => {
      document.getElementById('draft-result')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // ── 保存 ──
  function handleSave() {
    if (!generatedDraft) return
    const now = new Date().toISOString()
    const toSave: ContentDraft = {
      ...generatedDraft,
      content: editingContent,
      hashtags: editingHashtags,
      status: 'saved',
      updatedAt: now,
    }
    saveContentDraft(toSave)
    setIsSaved(true)
    setSavedDrafts(getContentDrafts())
  }

  // ── 削除 ──
  function handleDeleteDraft(id: string) {
    if (!window.confirm('このコンテンツを削除しますか？')) return
    deleteContentDraft(id)
    setSavedDrafts(getContentDrafts())
  }

  // ── 再編集（保存済みから） ──
  function handleReedit(draft: ContentDraft) {
    setSelectedPersonaId(draft.personaId)
    setSelectedContentType(draft.contentType)
    setGeneratedDraft(draft)
    setEditingContent(draft.content)
    setEditingHashtags(draft.hashtags)
    setIsSaved(true)
    setTimeout(() => {
      document.getElementById('draft-result')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) ?? null
  const filteredDrafts = filterPhase
    ? savedDrafts.filter((d) => d.phaseLink === filterPhase)
    : savedDrafts

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">コンテンツ生成</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">認知</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">集客</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">販売</span>
        </div>
        <p className="text-sm text-slate-500">
          ペルソナを選んでコンテンツ種別を選択すると、文章のたたき台を生成します。編集して保存してください。
        </p>
      </div>

      {/* ─── 生成フォーム ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        {/* ステップ1：ペルソナ選択 */}
        <StepLabel n={1} label="ペルソナを選ぶ" />

        {personas.length === 0 ? (
          <NoDataHint href="/personas/new" label="ペルソナを先に作成してください" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelectedPersonaId(p.id); setGeneratedDraft(null); setIsSaved(false) }}
                className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                  selectedPersonaId === p.id
                    ? 'bg-indigo-50 border-indigo-400'
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm text-slate-800 truncate">{p.name}</span>
                  <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full ${SOURCE_TYPE_COLOR[p.sourceType]}`}>
                    {SOURCE_TYPE_LABEL[p.sourceType]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{p.sourceName}</p>
              </button>
            ))}
          </div>
        )}

        {/* ステップ2：コンテンツ種別 */}
        <StepLabel n={2} label="コンテンツ種別を選ぶ" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-6">
          {ALL_CONTENT_TYPES.map((ct) => {
            const cfg = CONTENT_TYPE_CONFIG[ct]
            return (
              <button
                key={ct}
                onClick={() => { setSelectedContentType(ct); setGeneratedDraft(null); setIsSaved(false) }}
                className={`text-left px-4 py-3.5 rounded-xl border transition-all ${
                  selectedContentType === ct
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
          disabled={!selectedPersonaId || !selectedContentType}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
        >
          {(!selectedPersonaId || !selectedContentType)
            ? 'ペルソナとコンテンツ種別を選択してください'
            : 'たたき台を生成する'}
        </button>
      </div>

      {/* ─── 生成結果 ─── */}
      {generatedDraft && (
        <div id="draft-result" className="mb-5">
          {/* AI免責 */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">!</span>
            <p className="text-xs text-amber-700">
              AIの提案です。内容を確認・編集してから保存してください。最終的な文章の判断はあなたが行います。
            </p>
          </div>

          {/* 生成コンテキスト */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${PHASE_COLOR[generatedDraft.phaseLink]}`}>
                {PHASE_LABEL[generatedDraft.phaseLink]}
              </span>
              <span className="text-xs text-slate-500">
                {CONTENT_TYPE_CONFIG[generatedDraft.contentType].label}
              </span>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs text-slate-500">
                ペルソナ：{generatedDraft.personaName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <ContextCard label="誰に向けて" value={generatedDraft.targetPerson} />
              <ContextCard label="向き合う悩み" value={generatedDraft.addressedPain} />
              <ContextCard label="叶えたい未来" value={generatedDraft.addressedDesire} />
              <ContextCard label="伝えるべき強み" value={generatedDraft.strength} />
              <ContextCard label="行動を促す一文" value={generatedDraft.cta} />
              <ContextCard label="販売・予約導線" value={generatedDraft.salesChannel} />
            </div>
          </div>

          {/* 本文編集エリア */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">生成された文章（編集可）</p>
              <span className="text-xs text-slate-400">{editingContent.length}文字</span>
            </div>
            <textarea
              rows={14}
              value={editingContent}
              onChange={(e) => { setEditingContent(e.target.value); setIsSaved(false) }}
              className="w-full text-sm text-slate-800 leading-relaxed border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-mono bg-slate-50"
            />

            {/* ハッシュタグ（SNS系のみ） */}
            {editingHashtags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">ハッシュタグ（クリックで削除）</p>
                <div className="flex flex-wrap gap-1.5">
                  {editingHashtags.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => setEditingHashtags(editingHashtags.filter((_, j) => j !== i))}
                      className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      {tag} ×
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  コピー用：{editingHashtags.join(' ')}
                </p>
              </div>
            )}
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
            {isSaved ? '保存済み ✓' : 'このコンテンツを保存する'}
          </button>
          {isSaved && (
            <p className="text-center text-xs text-slate-400 mt-2">
              保存しました。下の「保存済みコンテンツ」に追加されています。
            </p>
          )}
        </div>
      )}

      {/* ─── 保存済みコンテンツ一覧 ─── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900">保存済みコンテンツ</h2>
          <span className="text-sm text-slate-400">{savedDrafts.length}件</span>
        </div>

        {savedDrafts.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            <button
              onClick={() => setFilterPhase(null)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                filterPhase === null
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              すべて
            </button>
            {(['awareness', 'acquisition', 'sales', 'retention'] as const).map((ph) => (
              <button
                key={ph}
                onClick={() => setFilterPhase(filterPhase === ph ? null : ph)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  filterPhase === ph
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {PHASE_LABEL[ph]}
              </button>
            ))}
          </div>
        )}

        {filteredDrafts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
            <p className="text-sm text-slate-400">
              {savedDrafts.length === 0
                ? 'まだ保存済みコンテンツがありません'
                : 'このフェーズのコンテンツはまだ保存されていません'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDrafts.map((draft) => (
              <SavedDraftCard
                key={draft.id}
                draft={draft}
                onReedit={() => handleReedit(draft)}
                onDelete={() => handleDeleteDraft(draft.id)}
              />
            ))}
          </div>
        )}

        {/* LP作成への接続案内 */}
        {savedDrafts.length > 0 && (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-amber-900 mb-1">次のステップ：LP作成支援</p>
            <p className="text-xs text-amber-700 mb-3">
              保存したコンテンツ（特にLP導入文）とペルソナ情報をもとに、LP全体の構成案・見出し・本文を作成できます
            </p>
            <a href="/lp" className="inline-block text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-lg transition-colors">
              LP作成支援へ →
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
      <p className="text-sm text-slate-500 mb-3">{label}</p>
      <a
        href={href}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 underline"
      >
        → 作成ページへ
      </a>
    </div>
  )
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs font-medium text-slate-700 leading-relaxed">
        {value || '未設定'}
      </p>
    </div>
  )
}

function SavedDraftCard({
  draft,
  onReedit,
  onDelete,
}: {
  draft: ContentDraft
  onReedit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cfg = CONTENT_TYPE_CONFIG[draft.contentType]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PHASE_COLOR[draft.phaseLink]}`}>
              {PHASE_LABEL[draft.phaseLink]}
            </span>
            <span className="text-xs font-medium text-slate-700">{cfg.label}</span>
            <span className="text-xs text-slate-400">ペルソナ：{draft.personaName}</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">素材：{draft.sourceName}</p>

          {/* コンテンツプレビュー */}
          <div className="relative">
            <pre className={`text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
              {draft.content}
            </pre>
            {!expanded && draft.content.length > 200 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          {draft.hashtags.length > 0 && expanded && (
            <p className="text-xs text-slate-400 mt-2">{draft.hashtags.join(' ')}</p>
          )}
        </div>

        <div className="flex-shrink-0 flex flex-col gap-1.5">
          <button
            onClick={onReedit}
            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
          >
            再編集
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 bg-white text-red-500 hover:bg-red-50 border border-red-100 rounded-lg font-medium transition-colors"
          >
            削除
          </button>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-xs text-slate-400 hover:text-indigo-600 underline"
      >
        {expanded ? '折り畳む' : '全文を見る'}
      </button>
    </div>
  )
}
