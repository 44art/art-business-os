'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Brand, Artwork, Workshop, Persona, PersonaSourceType } from '@/types'
import {
  getBrand, getArtworks, getWorkshops,
  getPersonaById, savePersona, updatePersona, deletePersona,
} from '@/lib/storage'
import { analyzeTarget } from '@/lib/analysis'
import { inputClass, textareaClass, selectClass } from '@/components/FormField'

// ─── 定数 ──────────────────────────────────────────────────

const CHANNEL_OPTIONS = ['Instagram', 'X', 'LINE', 'note', 'YouTube', 'TikTok']

const SOURCE_TABS: { type: PersonaSourceType; label: string; description: string }[] = [
  { type: 'brand',    label: 'ブランド',        description: '活動全体に使えるペルソナ' },
  { type: 'artwork',  label: '作品',            description: 'この作品の購入層を定義' },
  { type: 'workshop', label: 'ワークショップ',  description: 'WS参加者像を定義' },
]

// ─── フォームデータ型 ────────────────────────────────────────

type FormData = {
  name: string
  age: string
  gender: string
  occupation: string
  painsText: string         // 改行区切り → pains[]
  desiresText: string       // 改行区切り → desires[]
  purchaseReason: string
  purchaseAnxiety: string
  resonantPhrasesText: string  // 改行区切り → resonantPhrases[]
  usedChannels: string[]
  salesChannelFit: string
}

const EMPTY_FORM: FormData = {
  name: '',
  age: '',
  gender: '',
  occupation: '',
  painsText: '',
  desiresText: '',
  purchaseReason: '',
  purchaseAnxiety: '',
  resonantPhrasesText: '',
  usedChannels: [],
  salesChannelFit: '',
}

// ─── ドラフト生成 ────────────────────────────────────────────

function buildDraft(
  type: PersonaSourceType,
  source: Brand | Artwork | Workshop
): FormData & { sourceType: PersonaSourceType; sourceId: string; sourceName: string } {
  const analysis = analyzeTarget(type, source)
  const desiresText = analysis.personaHints.needs.join('\n')
  const usedChannels = analysis.personaHints.desiredChannels

  let name = ''
  let age = ''
  let occupation = ''
  let purchaseReason = ''
  let purchaseAnxiety = '価格が適正か判断できない\n本当に自分に合うか分からない'
  let salesChannelFit = ''

  if (type === 'brand') {
    const b = source as Brand
    name = `${b.name}の想定顧客`
    age = '30〜40代'
    occupation = '（職業・肩書きを入力してください）'
    purchaseReason = b.products
      ? `${b.products}を通じて自分らしさを表現したいから`
      : `${b.activities || 'アート'}の世界観・作家のストーリーに共感したから`
    salesChannelFit = b.salesChannel || 'Instagram DM → 銀行振込 or Stripe決済'
  } else if (type === 'artwork') {
    const a = source as Artwork
    name = `「${a.title}」の購入層`
    age = '25〜45代'
    occupation = '（職業・肩書きを入力してください）'
    purchaseReason = a.concept
      ? `${a.concept.slice(0, 40)}という世界観に惹かれた`
      : 'この作家の世界観・一点物の価値に惹かれた'
    purchaseAnxiety = '価格が高い・本当に自分の空間に合うか不安\n実物を見られないまま購入するのが心配'
    salesChannelFit = 'Instagram → LP → DM問い合わせ → 決済'
  } else {
    const w = source as Workshop
    name = `「${w.title}」の参加者像`
    age = '20〜40代'
    occupation = '（職業・肩書きを入力してください）'
    purchaseReason = w.description
      ? `${w.description.slice(0, 40).trim()}…という体験に興味があった`
      : '体験を通じた達成感・新しいスキルへの興味'
    purchaseAnxiety = '自分のレベルに合うか不安\n時間・場所・費用の調整が難しい'
    salesChannelFit = w.salesChannel || 'Instagram → 申込フォーム → 参加確定'
  }

  return {
    sourceType: type,
    sourceId: source.id,
    sourceName: analysis.sourceLabel,
    name,
    age,
    gender: '女性（想定） / 20〜40代',
    occupation,
    painsText: '',
    desiresText,
    purchaseReason,
    purchaseAnxiety,
    resonantPhrasesText: '',
    usedChannels,
    salesChannelFit,
  }
}

// ─── 変換ヘルパー ────────────────────────────────────────────

function textToLines(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ─── メインコンポーネント ────────────────────────────────────

export default function PersonaForm({ id }: { id?: string }) {
  const router = useRouter()
  const isEdit = !!id

  // データ
  const [brand, setBrand] = useState<Brand | null>(null)
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])

  // ソース選択（新規のみ）
  const [step, setStep] = useState<'select' | 'form'>(isEdit ? 'form' : 'select')
  const [activeTab, setActiveTab] = useState<PersonaSourceType>('brand')
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

  // フォーム
  const [sourceType, setSourceType] = useState<PersonaSourceType>('brand')
  const [sourceId, setSourceId] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  useEffect(() => {
    setBrand(getBrand())
    setArtworks(getArtworks())
    setWorkshops(getWorkshops())
  }, [])

  // 編集モード：既存データをロード
  useEffect(() => {
    if (!isEdit || !id) return
    const persona = getPersonaById(id)
    if (!persona) return
    setSourceType(persona.sourceType)
    setSourceId(persona.sourceId)
    setSourceName(persona.sourceName)
    setForm({
      name: persona.name,
      age: persona.age,
      gender: persona.gender,
      occupation: persona.occupation,
      painsText: persona.pains.join('\n'),
      desiresText: persona.desires.join('\n'),
      purchaseReason: persona.purchaseReason,
      purchaseAnxiety: persona.purchaseAnxiety,
      resonantPhrasesText: persona.resonantPhrases.join('\n'),
      usedChannels: persona.usedChannels,
      salesChannelFit: persona.salesChannelFit,
    })
  }, [id, isEdit])

  // ソース選択 → ドラフト生成
  function handleGenerateDraft() {
    if (!selectedSourceId) return
    let source: Brand | Artwork | Workshop | null = null
    if (activeTab === 'brand') source = brand
    if (activeTab === 'artwork') source = artworks.find((a) => a.id === selectedSourceId) ?? null
    if (activeTab === 'workshop') source = workshops.find((w) => w.id === selectedSourceId) ?? null
    if (!source) return

    const draft = buildDraft(activeTab, source)
    setSourceType(draft.sourceType)
    setSourceId(draft.sourceId)
    setSourceName(draft.sourceName)
    setForm({
      name: draft.name,
      age: draft.age,
      gender: draft.gender,
      occupation: draft.occupation,
      painsText: draft.painsText,
      desiresText: draft.desiresText,
      purchaseReason: draft.purchaseReason,
      purchaseAnxiety: draft.purchaseAnxiety,
      resonantPhrasesText: draft.resonantPhrasesText,
      usedChannels: draft.usedChannels,
      salesChannelFit: draft.salesChannelFit,
    })
    setStep('form')
  }

  // フォームフィールド更新
  function set(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleChannel(ch: string) {
    setForm((prev) => ({
      ...prev,
      usedChannels: prev.usedChannels.includes(ch)
        ? prev.usedChannels.filter((c) => c !== ch)
        : [...prev.usedChannels, ch],
    }))
  }

  // 保存
  function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const persona: Persona = {
      id: isEdit ? id! : generateId(),
      sourceType,
      sourceId,
      sourceName,
      name: form.name.trim(),
      age: form.age.trim(),
      gender: form.gender.trim(),
      occupation: form.occupation.trim(),
      pains: textToLines(form.painsText),
      desires: textToLines(form.desiresText),
      purchaseReason: form.purchaseReason.trim(),
      purchaseAnxiety: form.purchaseAnxiety.trim(),
      resonantPhrases: textToLines(form.resonantPhrasesText),
      usedChannels: form.usedChannels,
      salesChannelFit: form.salesChannelFit.trim(),
      createdAt: isEdit ? (getPersonaById(id!)?.createdAt ?? now) : now,
      updatedAt: now,
    }
    if (isEdit) {
      updatePersona(id!, persona)
    } else {
      savePersona(persona)
    }
    setSaving(false)
    setSavedOk(true)
  }

  // 削除
  function handleDelete() {
    if (!id || !window.confirm('このペルソナを削除しますか？')) return
    deletePersona(id)
    router.push('/personas')
  }

  // ─── 保存完了画面 ───

  if (savedOk) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl font-bold">✓</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {isEdit ? 'ペルソナを更新しました' : 'ペルソナを保存しました'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            このペルソナをもとにコンテンツを生成できます
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/content"
              className="block px-5 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              コンテンツを生成する →
            </Link>
            <Link
              href="/personas/new"
              className="block px-5 py-3 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              別のペルソナを作成する →
            </Link>
            <Link
              href="/personas"
              className="block px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors"
            >
              ← ペルソナ一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── ソース選択画面 ───

  if (step === 'select') {
    const itemList = (() => {
      if (activeTab === 'brand') {
        return brand
          ? [{ id: brand.id, label: brand.name, sub: brand.activities || '' }]
          : []
      }
      if (activeTab === 'artwork') {
        return artworks.map((a) => ({
          id: a.id,
          label: a.title,
          sub: `${a.genre || ''}${a.price ? ' ¥' + a.price.toLocaleString() : ''}`.trim(),
        }))
      }
      return workshops.map((w) => ({
        id: w.id,
        label: w.title,
        sub: `${w.format === 'in-person' ? '対面' : w.format === 'online' ? 'オンライン' : '出張'} ¥${w.price.toLocaleString()}/人`,
      }))
    })()

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">ペルソナ作成</h1>
          <p className="text-sm text-slate-500 mt-1">
            ブランド・作品・WSの情報をもとに顧客像のたたき台を生成し、編集・保存できます
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="font-semibold text-slate-900">ペルソナの元になる対象を選ぶ</h2>
          </div>

          <div className="flex gap-2 mb-5">
            {SOURCE_TABS.map((tab) => (
              <button
                key={tab.type}
                onClick={() => { setActiveTab(tab.type); setSelectedSourceId(null) }}
                className={`flex-1 py-2.5 px-2 rounded-xl text-sm font-medium border transition-all ${
                  activeTab === tab.type
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span className="block">{tab.label}</span>
                <span className={`text-xs font-normal block mt-0.5 ${activeTab === tab.type ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {tab.description}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="font-semibold text-slate-900">具体的な対象を選択する</h2>
          </div>

          {itemList.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-500">
                {activeTab === 'brand' ? 'ブランドが未登録です' : activeTab === 'artwork' ? '作品が未登録です' : 'WSが未登録です'}
              </p>
              <p className="text-xs text-slate-400 mt-1">先に登録してからペルソナを作成してください</p>
            </div>
          ) : (
            <div className="space-y-2 mb-5">
              {itemList.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSourceId(item.id)}
                  className={`w-full text-left flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                    selectedSourceId === item.id
                      ? 'bg-indigo-50 border-indigo-400'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div>
                    <p className={`font-medium text-sm ${selectedSourceId === item.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    {item.sub && <p className="text-xs text-slate-500 mt-0.5">{item.sub}</p>}
                  </div>
                  {selectedSourceId === item.id && (
                    <span className="text-indigo-600 text-xs font-semibold">選択中</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedSourceId && (
            <button
              onClick={handleGenerateDraft}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              この対象でペルソナのたたき台を生成する
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── ペルソナ編集フォーム ───

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          {!isEdit && (
            <button
              onClick={() => setStep('select')}
              className="text-sm text-slate-400 hover:text-indigo-600"
            >
              ← 対象を変える
            </button>
          )}
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'ペルソナを編集' : 'ペルソナを作成'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">もとになった対象：</span>
          <span className="text-xs font-medium text-slate-600">{sourceName}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
            {sourceType === 'brand' ? 'ブランド' : sourceType === 'artwork' ? '作品' : 'WS'}
          </span>
        </div>
      </div>

      {/* AI免責 */}
      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
        <span className="text-amber-500 flex-shrink-0 mt-0.5 text-sm">!</span>
        <p className="text-xs text-amber-700">
          たたき台はルールベースで生成した提案です。内容を確認・編集してから保存してください。最終的な顧客像の判断はあなたが行います。
        </p>
      </div>

      <div className="space-y-5">
        {/* ─ 基本属性 ─ */}
        <Section title="基本属性" step={isEdit ? undefined : 3}>
          <Field label="ペルソナ名" required hint="例：30代アート好き会社員・Aさん">
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="ペルソナ名を入力してください"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="年齢層">
              <input
                type="text"
                value={form.age}
                onChange={(e) => set('age', e.target.value)}
                placeholder="例：30〜40代"
                className={inputClass}
              />
            </Field>
            <Field label="性別・家族構成の想定">
              <input
                type="text"
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                placeholder="例：女性・既婚・子なし"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="職業・肩書き">
            <input
              type="text"
              value={form.occupation}
              onChange={(e) => set('occupation', e.target.value)}
              placeholder="例：会社員（マーケター）・フリーランスデザイナー"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* ─ 心理情報 ─ */}
        <Section title="心理・感情">
          <Field label="悩み・困りごと" hint="1行1つで入力。対象を探す前に感じている問題や不満。">
            <textarea
              rows={4}
              value={form.painsText}
              onChange={(e) => set('painsText', e.target.value)}
              placeholder={`例：\n自分に合ったアートを探すのが難しい\n贈り物に何を選べばいいか分からない\nオリジナルのものが欲しいが方法が分からない`}
              className={textareaClass}
            />
          </Field>
          <Field label="欲しい未来・理想の状態" hint="1行1つで入力。この人が本当に手に入れたいもの。">
            <textarea
              rows={4}
              value={form.desiresText}
              onChange={(e) => set('desiresText', e.target.value)}
              placeholder={`例：\n世界に一つだけのものを持ちたい\n自分らしさを日常に表現したい\n作家を直接応援して特別な体験をしたい`}
              className={textareaClass}
            />
          </Field>
          <Field label="購入・参加の理由" hint="この人が「決断するポイント」を一言で。">
            <input
              type="text"
              value={form.purchaseReason}
              onChange={(e) => set('purchaseReason', e.target.value)}
              placeholder="例：作家のストーリーに共感し、一点物の価値を感じたから"
              className={inputClass}
            />
          </Field>
          <Field label="購入前の不安" hint="1行1つで入力。この人が躊躇う理由。">
            <textarea
              rows={3}
              value={form.purchaseAnxiety}
              onChange={(e) => set('purchaseAnxiety', e.target.value)}
              placeholder={`例：\n価格が高く本当に価値があるか不安\n実物を見ずに買うのが心配\nアフターフォローが分からない`}
              className={textareaClass}
            />
          </Field>
        </Section>

        {/* ─ 言葉・チャネル ─ */}
        <Section title="言葉・チャネル・導線">
          <Field label="刺さる言葉・キャッチコピー案" hint="1行1つで入力。このペルソナに響くフレーズ。">
            <textarea
              rows={3}
              value={form.resonantPhrasesText}
              onChange={(e) => set('resonantPhrasesText', e.target.value)}
              placeholder={`例：\nあなただけの一点物\n作家の想いが込められた、世界に一つのアート\n日常に「特別」を取り入れたい人へ`}
              className={textareaClass}
            />
          </Field>
          <Field label="よく使うSNS・チャネル">
            <div className="flex flex-wrap gap-2">
              {CHANNEL_OPTIONS.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannel(ch)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    form.usedChannels.includes(ch)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </Field>
          <Field label="向いている販売導線" hint="このペルソナへの最適な購入・申込の流れ。">
            <input
              type="text"
              value={form.salesChannelFit}
              onChange={(e) => set('salesChannelFit', e.target.value)}
              placeholder="例：Instagram → LP → DM → 決済"
              className={inputClass}
            />
          </Field>
        </Section>

        {/* ─ 保存・削除 ─ */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {saving ? '保存中…' : isEdit ? 'ペルソナを更新する' : 'ペルソナを保存する'}
          </button>
          {isEdit && (
            <button
              onClick={handleDelete}
              className="px-5 py-3 bg-white text-red-600 hover:bg-red-50 border border-red-200 font-medium rounded-xl transition-colors text-sm"
            >
              削除
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── 補助コンポーネント ──────────────────────────────────────

function Section({ title, step, children }: { title: string; step?: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        {step !== undefined && (
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            {step}
          </span>
        )}
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
