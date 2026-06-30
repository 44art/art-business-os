'use client'

import { useState, useEffect } from 'react'
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
  ConsultantPhaseItem,
  UsageStatus,
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
  saveConsultantReport,
  updateConsultantReport,
  deleteConsultantReport,
} from '@/lib/storage'
import { generateConsultantReport } from '@/lib/consultant'
import { CopyButton } from '@/components/CopyButton'
import { UsageStatusBadge } from '@/components/UsageStatusBadge'

// ─── 定数 ─────────────────────────────────────────────────

const PHASE_META: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  awareness:   { label: '認知',        color: 'text-blue-700',   bgColor: 'bg-blue-50',   borderColor: 'border-blue-200' },
  acquisition: { label: '集客',        color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  sales:       { label: '販売',        color: 'text-green-700',  bgColor: 'bg-green-50',  borderColor: 'border-green-200' },
  retention:   { label: 'リピーター化', color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
}

// ─── ユーティリティ ───────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function sourceTypeLabel(t: string) {
  return t === 'brand' ? 'ブランド' : t === 'artwork' ? '作品' : 'WS'
}

function getSourceName(s: Brand | Artwork | Workshop): string {
  if ('name' in s) return (s as Brand).name
  if ('title' in s) return (s as Artwork | Workshop).title
  return ''
}

// ─── フェーズカード ───────────────────────────────────────

function PhaseCard({
  phase,
  onEdit,
}: {
  phase: ConsultantPhaseItem
  onEdit: (field: keyof ConsultantPhaseItem, idx: number, value: string) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [editingKey, setEditingKey] = useState<string>('')
  const meta = PHASE_META[phase.phase] ?? PHASE_META.awareness

  function EditableList({
    field,
    items,
    label,
    labelColor,
  }: {
    field: keyof ConsultantPhaseItem
    items: string[]
    label: string
    labelColor: string
  }) {
    return (
      <div>
        <p className={`text-xs font-semibold mb-1 ${labelColor}`}>{label}</p>
        <ul className="space-y-1">
          {(items as string[]).map((item, idx) => {
            const key = `${field}-${idx}`
            return (
              <li key={idx}>
                {editingKey === key ? (
                  <textarea
                    autoFocus
                    defaultValue={item}
                    onBlur={(e) => {
                      onEdit(field, idx, e.target.value)
                      setEditingKey('')
                    }}
                    rows={2}
                    className="w-full text-xs border border-slate-300 rounded px-2 py-1 resize-y focus:outline-none focus:ring-1 focus:ring-blue-300"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingKey(key)}
                    className="w-full text-left text-xs text-slate-700 hover:bg-white/70 rounded px-1 py-0.5 whitespace-pre-wrap"
                  >
                    {item}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${meta.borderColor}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${meta.bgColor}`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-base font-bold ${meta.color}`}>{phase.phaseLabel}</span>
          <span className="text-xs text-slate-500">
            ✅ {phase.done.length} | ⚠️ {phase.missing.length} | 📌 {phase.nextActions.length}
          </span>
        </div>
        <span className="text-slate-400 text-xs">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className={`p-4 grid gap-4 sm:grid-cols-2 ${meta.bgColor}`}>
          <EditableList field="done" items={phase.done} label="✅ できていること" labelColor="text-green-600" />
          <EditableList field="missing" items={phase.missing} label="⚠️ 足りていないこと" labelColor="text-red-500" />
          <EditableList field="improvements" items={phase.improvements} label="💡 改善すべきこと" labelColor="text-orange-500" />
          <EditableList field="nextActions" items={phase.nextActions} label="📌 次にやるべきアクション" labelColor="text-blue-600" />
        </div>
      )}
    </div>
  )
}

// ─── データサマリーバッジ ─────────────────────────────────

function DataBadge({ label, count }: { label: string; count: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
        count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400'
      }`}
    >
      {count > 0 ? '✓' : '○'} {label}: {count}件
    </span>
  )
}

// ─── メインコンポーネント ─────────────────────────────────

export default function ConsultantPage() {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [allPersonas, setAllPersonas] = useState<Persona[]>([])
  const [allContent, setAllContent] = useState<ContentDraft[]>([])
  const [allLp, setAllLp] = useState<LandingPageDraft[]>([])
  const [allLine, setAllLine] = useState<LineStrategyDraft[]>([])
  const [allSns, setAllSns] = useState<SnsStrategyDraft[]>([])
  const [reports, setReports] = useState<ConsultantReport[]>([])

  const [sourceType, setSourceType] = useState<'brand' | 'artwork' | 'workshop'>('brand')
  const [sourceId, setSourceId] = useState<string>('')
  const [report, setReport] = useState<ConsultantReport | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [expandedReportId, setExpandedReportId] = useState('')
  const [editingOverall, setEditingOverall] = useState<Record<string, string | boolean>>({})

  useEffect(() => {
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
    setAllPersonas(getPersonas())
    setAllContent(getContentDrafts())
    setAllLp(getLpDrafts())
    setAllLine(getLineDrafts())
    setAllSns(getSnsDrafts())
    setReports(getConsultantReports())
  }, [])

  // ─── ソース候補 ─────────────────────────────────────────

  const sourceOptions =
    sourceType === 'brand'
      ? brand ? [{ id: brand.id, name: brand.name }] : []
      : sourceType === 'artwork'
      ? artworks.map((a) => ({ id: a.id, name: a.title }))
      : workshops.map((w) => ({ id: w.id, name: w.title }))

  const selectedSource =
    sourceType === 'brand'
      ? brand
      : sourceType === 'artwork'
      ? artworks.find((a) => a.id === sourceId) ?? null
      : workshops.find((w) => w.id === sourceId) ?? null

  // ─── 関連データ ─────────────────────────────────────────

  const relatedPersonas = allPersonas.filter(
    (p) => p.sourceType === sourceType && p.sourceId === sourceId
  )
  const personaIds = relatedPersonas.map((p) => p.id)
  const relContent = allContent.filter((x) => personaIds.includes(x.personaId))
  const relLp = allLp.filter((x) => personaIds.includes(x.personaId))
  const relLine = allLine.filter((x) => personaIds.includes(x.personaId))
  const relSns = allSns.filter((x) => personaIds.includes(x.personaId))

  // ─── 診断生成 ───────────────────────────────────────────

  function handleGenerate() {
    if (!sourceId || !selectedSource) return
    setIsGenerating(true)
    setTimeout(() => {
      const result = generateConsultantReport({
        sourceType,
        sourceId,
        sourceName: getSourceName(selectedSource),
        source: selectedSource,
        personas: relatedPersonas,
        contentDrafts: relContent,
        lpDrafts: relLp,
        lineDrafts: relLine,
        snsDrafts: relSns,
      })
      const enriched: ConsultantReport = {
        ...result,
        personaIds: relatedPersonas.map((p) => p.id),
        personaNames: relatedPersonas.map((p) => p.name),
        relatedDataSummary: {
          content: relContent.length,
          lp: relLp.length,
          line: relLine.length,
          sns: relSns.length,
        },
      }
      setReport(enriched)
      setEditingOverall({})
      setIsGenerating(false)
    }, 400)
  }

  // ─── フェーズ項目編集 ────────────────────────────────

  function handlePhaseEdit(
    phaseKey: string,
    field: keyof ConsultantPhaseItem,
    idx: number,
    value: string
  ) {
    if (!report) return
    setReport({
      ...report,
      phases: report.phases.map((p) =>
        p.phase === phaseKey
          ? { ...p, [field]: (p[field] as string[]).map((x: string, i: number) => (i === idx ? value : x)) }
          : p
      ),
      updatedAt: new Date().toISOString(),
    })
  }

  // ─── 全体診断編集 ────────────────────────────────────

  function handleOverallText(field: 'topPriority' | 'quickWin', value: string) {
    if (!report) return
    setReport({ ...report, [field]: value, updatedAt: new Date().toISOString() })
  }

  function handleOverallList(
    field: 'activeFlows' | 'weakFlows' | 'contentIdeas',
    idx: number,
    value: string
  ) {
    if (!report) return
    setReport({
      ...report,
      [field]: (report[field] as string[]).map((x, i) => (i === idx ? value : x)),
      updatedAt: new Date().toISOString(),
    })
  }

  // ─── 保存 ──────────────────────────────────────────────

  function handleSave() {
    if (!report) return
    const toSave: ConsultantReport = { ...report, status: 'saved', updatedAt: new Date().toISOString() }
    const existing = reports.find((r) => r.id === report.id)
    if (existing) {
      updateConsultantReport(toSave.id, toSave)
    } else {
      saveConsultantReport(toSave)
    }
    setReports(getConsultantReports())
    setReport(toSave)
    setSavedMsg('保存しました')
    setTimeout(() => setSavedMsg(''), 2500)
  }

  function handleDuplicate(r: ConsultantReport) {
    const now = new Date().toISOString()
    const copy: ConsultantReport = {
      ...r,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: 'draft',
      usageStatus: 'unused',
      generatedAt: now,
      updatedAt: now,
    }
    saveConsultantReport(copy)
    setReports(getConsultantReports())
  }

  function handleUpdateStatusReport(id: string, status: UsageStatus) {
    updateConsultantReport(id, { usageStatus: status })
    setReports(getConsultantReports())
  }

  function handleDelete(id: string) {
    if (!confirm('この診断レポートを削除しますか？')) return
    deleteConsultantReport(id)
    setReports(getConsultantReports())
    if (report?.id === id) setReport(null)
  }

  // ─── 描画 ──────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* ヘッダー */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">AIコンサルタント</h1>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">全フェーズ</span>
        </div>
        <p className="text-sm text-slate-500">
          診断対象を選ぶと、認知→集客→販売→リピーター化の全フェーズを診断し、次にやるべきアクションを提案します。
        </p>
      </div>

      {/* 素材未登録ガイド */}
      {!brand && artworks.length === 0 && workshops.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-amber-900 mb-1">まず診断対象の素材を登録してください</p>
          <p className="text-xs text-amber-700 mb-3">
            AIコンサルタントの診断には、ブランド・作品・WSのいずれかの登録が必要です。
            素材を登録すると、認知→集客→販売→リピーター化の全フェーズを診断できます。
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/brand" className="text-xs font-medium px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">ブランドを登録 →</a>
            <a href="/artworks/new" className="text-xs font-medium px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">作品を登録 →</a>
            <a href="/workshops/new" className="text-xs font-medium px-3 py-1.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors">WSを登録 →</a>
          </div>
        </div>
      )}

      {/* STEP 1: 診断対象選択 */}
      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">STEP 1 診断対象を選択</h2>
        <div className="flex gap-2 mb-3">
          {(['brand', 'artwork', 'workshop'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setSourceType(t); setSourceId('') }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                sourceType === t
                  ? 'border-slate-800 bg-slate-800 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-400'
              }`}
            >
              {sourceTypeLabel(t)}
            </button>
          ))}
        </div>
        <select
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          className="w-full border border-slate-200 rounded-md text-sm px-3 py-2 text-slate-700 bg-white"
        >
          <option value="">
            {sourceOptions.length === 0
              ? `${sourceTypeLabel(sourceType)}が登録されていません`
              : `${sourceTypeLabel(sourceType)}を選択…`}
          </option>
          {sourceOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </section>

      {/* STEP 2: 関連データサマリー */}
      {sourceId && selectedSource && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">
            STEP 2 関連データを確認
            <span className="ml-2 text-xs text-slate-400 font-normal">
              診断対象: {getSourceName(selectedSource)}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <DataBadge label="ペルソナ" count={relatedPersonas.length} />
            <DataBadge label="コンテンツ" count={relContent.length} />
            <DataBadge label="LP案" count={relLp.length} />
            <DataBadge label="LINE戦略" count={relLine.length} />
            <DataBadge label="SNS戦略" count={relSns.length} />
          </div>
          {relatedPersonas.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">紐づくペルソナ:</p>
              <div className="flex flex-wrap gap-1">
                {relatedPersonas.map((p) => (
                  <span key={p.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {relatedPersonas.length === 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <strong>ペルソナが未作成です。</strong>
              ペルソナを作成してから診断するとより精度の高い提案が得られます。ペルソナなしでも診断は実行できます。
            </div>
          )}
        </section>
      )}

      {/* 診断ボタン */}
      {sourceId && selectedSource && (
        <div className="flex justify-center">
          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isGenerating ? '診断中…' : 'マーケティング導線を診断する'}
          </button>
        </div>
      )}

      {/* 診断結果 */}
      {report && (
        <section className="space-y-6">
          {/* AI免責表示 */}
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-2">
            <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
            <p className="text-xs text-amber-700 leading-relaxed">{report.aiDisclaimer}</p>
          </div>

          {/* フェーズ別診断 */}
          <div>
            <h2 className="font-bold text-slate-900 text-lg mb-3">フェーズ別診断</h2>
            <div className="grid gap-3">
              {report.phases.map((phase) => (
                <PhaseCard
                  key={phase.phase}
                  phase={phase}
                  onEdit={(field, idx, value) => handlePhaseEdit(phase.phase, field, idx, value)}
                />
              ))}
            </div>
          </div>

          {/* 全体診断 */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
            <h2 className="font-bold text-slate-900 text-lg">全体診断</h2>

            {/* 最優先ポイント */}
            <div>
              <p className="text-sm font-semibold text-red-600 mb-1">🚨 最優先で改善すべきポイント</p>
              {editingOverall['topPriority'] ? (
                <textarea
                  autoFocus
                  value={report.topPriority}
                  onChange={(e) => handleOverallText('topPriority', e.target.value)}
                  onBlur={() => setEditingOverall((p) => ({ ...p, topPriority: false }))}
                  rows={4}
                  className="w-full border border-slate-300 rounded-md text-sm px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingOverall((p) => ({ ...p, topPriority: true }))}
                  className="w-full text-left text-sm text-slate-700 whitespace-pre-wrap bg-red-50 border border-red-100 rounded-lg p-3 hover:bg-red-100 transition-colors"
                >
                  {report.topPriority}
                </button>
              )}
            </div>

            {/* 次の一手 */}
            <div>
              <p className="text-sm font-semibold text-green-600 mb-1">💰 売上につながりやすい次の一手</p>
              {editingOverall['quickWin'] ? (
                <textarea
                  autoFocus
                  value={report.quickWin}
                  onChange={(e) => handleOverallText('quickWin', e.target.value)}
                  onBlur={() => setEditingOverall((p) => ({ ...p, quickWin: false }))}
                  rows={3}
                  className="w-full border border-slate-300 rounded-md text-sm px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingOverall((p) => ({ ...p, quickWin: true }))}
                  className="w-full text-left text-sm text-slate-700 whitespace-pre-wrap bg-green-50 border border-green-100 rounded-lg p-3 hover:bg-green-100 transition-colors"
                >
                  {report.quickWin}
                </button>
              )}
            </div>

            {/* 今すぐ使える導線 */}
            <div>
              <p className="text-sm font-semibold text-blue-600 mb-1">✅ 今すぐ使える導線</p>
              <ul className="space-y-1">
                {report.activeFlows.map((flow, idx) => {
                  const eKey = `af-${idx}`
                  return (
                    <li key={idx}>
                      {editingOverall[eKey] ? (
                        <input
                          autoFocus
                          type="text"
                          defaultValue={flow}
                          onBlur={(e) => {
                            handleOverallList('activeFlows', idx, e.target.value)
                            setEditingOverall((p) => ({ ...p, [eKey]: false }))
                          }}
                          className="w-full border border-slate-300 rounded text-sm px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingOverall((p) => ({ ...p, [eKey]: true }))}
                          className="w-full text-left text-sm text-blue-700 bg-blue-50 rounded px-3 py-1.5 hover:bg-blue-100"
                        >
                          → {flow}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* まだ弱い導線 */}
            <div>
              <p className="text-sm font-semibold text-orange-500 mb-1">⚠️ まだ弱い導線</p>
              <ul className="space-y-1">
                {report.weakFlows.map((flow, idx) => {
                  const eKey = `wf-${idx}`
                  return (
                    <li key={idx}>
                      {editingOverall[eKey] ? (
                        <input
                          autoFocus
                          type="text"
                          defaultValue={flow}
                          onBlur={(e) => {
                            handleOverallList('weakFlows', idx, e.target.value)
                            setEditingOverall((p) => ({ ...p, [eKey]: false }))
                          }}
                          className="w-full border border-slate-300 rounded text-sm px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingOverall((p) => ({ ...p, [eKey]: true }))}
                          className="w-full text-left text-sm text-orange-700 bg-orange-50 rounded px-3 py-1.5 hover:bg-orange-100"
                        >
                          △ {flow}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* 今後作るべきコンテンツ案 */}
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">📝 今後作るべきコンテンツ案</p>
              <ul className="space-y-1">
                {report.contentIdeas.map((idea, idx) => {
                  const eKey = `ci-${idx}`
                  return (
                    <li key={idx}>
                      {editingOverall[eKey] ? (
                        <input
                          autoFocus
                          type="text"
                          defaultValue={idea}
                          onBlur={(e) => {
                            handleOverallList('contentIdeas', idx, e.target.value)
                            setEditingOverall((p) => ({ ...p, [eKey]: false }))
                          }}
                          className="w-full border border-slate-300 rounded text-sm px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingOverall((p) => ({ ...p, [eKey]: true }))}
                          className="w-full text-left text-sm text-slate-700 bg-slate-50 rounded px-3 py-1.5 hover:bg-slate-100"
                        >
                          • {idea}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
              ✏️ 各項目をクリックすると編集できます（クリック → 編集 → フォーカスを外すと確定）
            </p>
          </div>

          {/* 保存 */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              診断結果を保存する
            </button>
            {savedMsg && <span className="text-sm text-green-600 font-medium">{savedMsg}</span>}
            {report.status === 'saved' && !savedMsg && (
              <span className="text-xs text-slate-400">保存済み</span>
            )}
          </div>

          {/* 診断後の次のアクション */}
          {report.status === 'saved' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-800 mb-2">診断完了！次のアクション</p>
              <p className="text-xs text-indigo-700 mb-3">
                診断結果の「最優先で改善すべきポイント」と「売上につながりやすい次の一手」からアクションを1つ選んで実行してください。
                ダッシュボードでは最優先アクションが常時表示されます。
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/"
                  className="text-xs font-medium px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  ダッシュボードで全体進捗を確認する →
                </a>
                <a
                  href="/content"
                  className="text-xs font-medium px-3 py-1.5 bg-white text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  コンテンツ改善へ →
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 保存済みレポート一覧 */}
      {reports.length > 0 && (
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">保存済み診断レポート（{reports.length}件）</h2>
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                        {sourceTypeLabel(r.sourceType)}: {r.sourceName}
                      </span>
                      <UsageStatusBadge status={r.usageStatus} onChange={(s) => handleUpdateStatusReport(r.id, s)} />
                      <span className="text-xs text-slate-400">{fmtDate(r.updatedAt)}</span>
                    </div>
                    {r.personaNames && r.personaNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {r.personaNames.map((name, i) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.relatedDataSummary && (
                      <div className="flex gap-2 text-xs text-slate-400">
                        <span>コンテンツ {r.relatedDataSummary.content}件</span>
                        <span>LP {r.relatedDataSummary.lp}件</span>
                        <span>LINE {r.relatedDataSummary.line}件</span>
                        <span>SNS {r.relatedDataSummary.sns}件</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={r.sourceType === 'brand' ? '/brand' : r.sourceType === 'artwork' ? `/artworks/${r.sourceId}/edit` : `/workshops/${r.sourceId}/edit`}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      素材→
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(r)}
                      className="text-xs text-slate-600 hover:underline"
                    >
                      複製
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedReportId(expandedReportId === r.id ? '' : r.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {expandedReportId === r.id ? '閉じる' : '詳細'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>
                </div>
                {expandedReportId === r.id && (
                  <div className="border-t border-slate-100 px-4 py-3 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {r.phases.map((phase) => {
                        const meta = PHASE_META[phase.phase]
                        return (
                          <div key={phase.phase} className={`rounded-lg p-2 ${meta.bgColor} border ${meta.borderColor}`}>
                            <p className={`text-xs font-bold ${meta.color}`}>{phase.phaseLabel}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              ✅{phase.done.length} ⚠️{phase.missing.length}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="bg-red-50 rounded p-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-red-600 font-semibold">最優先改善ポイント</p>
                          <CopyButton text={r.topPriority} />
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{r.topPriority}</p>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-green-600 font-semibold">次の一手</p>
                          <CopyButton text={r.quickWin} />
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{r.quickWin}</p>
                      </div>
                      {r.activeFlows && r.activeFlows.length > 0 && (
                        <div className="bg-teal-50 rounded p-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-teal-600 font-semibold">今すぐ使える導線</p>
                            <CopyButton text={r.activeFlows.join('\n')} label="一括コピー" />
                          </div>
                          <ul className="text-slate-700 space-y-0.5">
                            {r.activeFlows.map((flow, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-teal-400 flex-shrink-0">→</span>
                                {flow}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.contentIdeas && r.contentIdeas.length > 0 && (
                        <div className="bg-blue-50 rounded p-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-blue-600 font-semibold">コンテンツ案</p>
                            <CopyButton text={r.contentIdeas.join('\n')} label="一括コピー" />
                          </div>
                          <ul className="text-slate-700 space-y-0.5">
                            {r.contentIdeas.map((idea, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-blue-400 flex-shrink-0">•</span>
                                {idea}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">{r.aiDisclaimer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
