'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Workshop, WorkshopFormat, WorkshopStatus } from '@/types'
import { getWorkshopById, saveWorkshop, updateWorkshop, deleteWorkshop } from '@/lib/storage'
import FormField, { inputClass, textareaClass, selectClass } from '@/components/FormField'

const FORMAT_OPTIONS: { value: WorkshopFormat; label: string }[] = [
  { value: 'in-person', label: '対面（会場）' },
  { value: 'online', label: 'オンライン' },
  { value: 'offsite', label: '出張' },
]

const STATUS_OPTIONS: { value: WorkshopStatus; label: string }[] = [
  { value: 'open', label: '募集中' },
  { value: 'draft', label: '下書き' },
  { value: 'full', label: '満員' },
  { value: 'closed', label: '終了' },
]

const statusLabel: Record<WorkshopStatus, string> = {
  open: '募集中',
  draft: '下書き',
  full: '満員',
  closed: '終了',
}

const statusColor: Record<WorkshopStatus, string> = {
  open: 'bg-green-100 text-green-800',
  draft: 'bg-yellow-100 text-yellow-800',
  full: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-600',
}

type FormState = {
  title: string
  description: string
  targetAudience: string
  format: WorkshopFormat
  price: string
  duration: string
  salesChannel: string
  status: WorkshopStatus
}

const initialForm: FormState = {
  title: '',
  description: '',
  targetAudience: '',
  format: 'in-person',
  price: '',
  duration: '',
  salesChannel: '',
  status: 'draft',
}

type Props = {
  id?: string
}

export default function WorkshopForm({ id }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  const isEdit = Boolean(id)

  useEffect(() => {
    if (!id) return
    const ws = getWorkshopById(id)
    if (ws) {
      setForm({
        title: ws.title,
        description: ws.description,
        targetAudience: ws.targetAudience,
        format: ws.format,
        price: ws.price.toString(),
        duration: ws.duration,
        salesChannel: ws.salesChannel,
        status: ws.status,
      })
    }
  }, [id])

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('ワークショップ名は必須です')
      return
    }
    if (!form.description.trim()) {
      setError('内容は必須です')
      return
    }
    const now = new Date().toISOString()
    const data: Partial<Workshop> = {
      title: form.title.trim(),
      description: form.description.trim(),
      targetAudience: form.targetAudience.trim(),
      format: form.format,
      price: form.price ? Number(form.price) : 0,
      duration: form.duration.trim(),
      salesChannel: form.salesChannel.trim(),
      status: form.status,
      updatedAt: now,
    }
    if (isEdit && id) {
      updateWorkshop(id, data)
    } else {
      saveWorkshop({ ...data, id: crypto.randomUUID(), createdAt: now } as Workshop)
    }
    setSavedOk(true)
  }

  function handleDelete() {
    if (!id) return
    setDeleting(true)
    deleteWorkshop(id)
    router.push('/workshops')
  }

  const ws = id ? getWorkshopById(id) : null

  if (savedOk) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl font-bold">✓</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {isEdit ? 'WSを更新しました' : 'WSを保存しました'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">次のステップに進みましょう</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/content"
              className="block px-5 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              WS告知文を生成する →
            </Link>
            <Link
              href="/personas/new"
              className="block px-5 py-3 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              このWSのペルソナを作成する →
            </Link>
            <Link
              href="/workshops"
              className="block px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors"
            >
              ← WS一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/workshops" className="text-sm text-slate-500 hover:text-slate-700">
          ← WS管理
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">
          {isEdit ? 'WSを編集する' : 'WSを登録する'}
        </h1>
        {isEdit && ws && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[ws.status]}`}>
            {statusLabel[ws.status]}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField label="ワークショップ名" required>
          <input
            type="text"
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例：スニーカーペイント体験ワークショップ"
          />
        </FormField>

        <FormField
          label="内容"
          required
          hint="何をするWSか具体的に書いてください（AI生成の素材になります）"
        >
          <textarea
            className={textareaClass}
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="例：自分だけのオリジナルスニーカーをペイントするワークショップ。初心者でも安心のサポート付き。好きな色や絵柄で世界に1足だけのスニーカーを作ります。"
          />
        </FormField>

        <FormField
          label="対象者"
          hint="誰向けのWSか（AI生成の精度が上がります）"
        >
          <input
            type="text"
            className={inputClass}
            value={form.targetAudience}
            onChange={(e) => set('targetAudience', e.target.value)}
            placeholder="例：初心者歓迎、小学生以上、カップル・友達との参加OK"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="開催形式" required>
            <select
              className={selectClass}
              value={form.format}
              onChange={(e) => set('format', e.target.value as WorkshopFormat)}
            >
              {FORMAT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="ステータス" required>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as WorkshopStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="価格（円/人）" hint="無料の場合は0">
            <input
              type="number"
              className={inputClass}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="例：5000"
              min={0}
            />
          </FormField>

          <FormField label="所要時間" hint="例：2時間、半日">
            <input
              type="text"
              className={inputClass}
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
              placeholder="例：2時間"
            />
          </FormField>
        </div>

        <FormField
          label="集客導線"
          hint="どこから参加者を集めるか（AI生成に活用します）"
        >
          <textarea
            className={textareaClass}
            rows={2}
            value={form.salesChannel}
            onChange={(e) => set('salesChannel', e.target.value)}
            placeholder="例：Instagram → プロフィールリンク → Googleフォーム申込"
          />
        </FormField>

        <div className="flex items-center justify-between pt-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              このWSを削除する
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <Link
              href="/workshops"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {isEdit ? '更新する' : '保存する'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
