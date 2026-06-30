'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Artwork, ArtworkStatus } from '@/types'
import { getArtworkById, saveArtwork, updateArtwork, deleteArtwork } from '@/lib/storage'
import FormField, { inputClass, textareaClass, selectClass } from '@/components/FormField'

const GENRE_OPTIONS = ['スニーカーペイント', '箔画', '抽象画', 'その他'] as const

const STATUS_OPTIONS: { value: ArtworkStatus; label: string }[] = [
  { value: 'selling', label: '販売中' },
  { value: 'sold', label: '売却済' },
  { value: 'hidden', label: '非公開' },
]

const statusLabel: Record<ArtworkStatus, string> = {
  selling: '販売中',
  sold: '売却済',
  hidden: '非公開',
}

const statusColor: Record<ArtworkStatus, string> = {
  selling: 'bg-green-100 text-green-800',
  sold: 'bg-slate-100 text-slate-600',
  hidden: 'bg-yellow-100 text-yellow-800',
}

type FormState = {
  title: string
  genre: string
  concept: string
  features: string
  targetCustomer: string
  price: string
  status: ArtworkStatus
}

const initialForm: FormState = {
  title: '',
  genre: 'スニーカーペイント',
  concept: '',
  features: '',
  targetCustomer: '',
  price: '',
  status: 'selling',
}

type Props = {
  id?: string
}

export default function ArtworkForm({ id }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [savedOk, setSavedOk] = useState(false)

  const isEdit = Boolean(id)

  useEffect(() => {
    if (!id) return
    const artwork = getArtworkById(id)
    if (artwork) {
      setForm({
        title: artwork.title,
        genre: artwork.genre,
        concept: artwork.concept,
        features: artwork.features,
        targetCustomer: artwork.targetCustomer,
        price: artwork.price?.toString() ?? '',
        status: artwork.status,
      })
    }
  }, [id])

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('作品名は必須です')
      return
    }
    if (!form.concept.trim()) {
      setError('コンセプトは必須です')
      return
    }
    const now = new Date().toISOString()
    const data: Partial<Artwork> = {
      title: form.title.trim(),
      genre: form.genre,
      concept: form.concept.trim(),
      features: form.features.trim(),
      targetCustomer: form.targetCustomer.trim(),
      price: form.price ? Number(form.price) : undefined,
      status: form.status,
      updatedAt: now,
    }
    if (isEdit && id) {
      updateArtwork(id, data)
    } else {
      saveArtwork({ ...data, id: crypto.randomUUID(), createdAt: now } as Artwork)
    }
    setSavedOk(true)
  }

  function handleDelete() {
    if (!id) return
    setDeleting(true)
    deleteArtwork(id)
    router.push('/artworks')
  }

  const artwork = id ? getArtworkById(id) : null

  if (savedOk) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-600 text-xl font-bold">✓</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            {isEdit ? '作品を更新しました' : '作品を保存しました'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">次のステップに進みましょう</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Link
              href="/analysis"
              className="block px-5 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              AIマーケティング分析へ →
            </Link>
            <Link
              href="/content"
              className="block px-5 py-3 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
            >
              コンテンツを生成する →
            </Link>
            <Link
              href="/artworks"
              className="block px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors"
            >
              ← 作品一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/artworks" className="text-sm text-slate-500 hover:text-slate-700">
          ← 作品管理
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">
          {isEdit ? '作品を編集する' : '作品を登録する'}
        </h1>
        {isEdit && artwork && (
          <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[artwork.status]}`}>
            {statusLabel[artwork.status]}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <FormField label="作品名" required>
          <input
            type="text"
            className={inputClass}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="例：赤いAJ1カスタム"
          />
        </FormField>

        <FormField label="作品ジャンル" required>
          <select
            className={selectClass}
            value={form.genre}
            onChange={(e) => set('genre', e.target.value)}
          >
            {GENRE_OPTIONS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </FormField>

        <FormField
          label="コンセプト"
          required
          hint="この作品に込めた想い・テーマ・ストーリーを書いてください（AI生成の素材になります）"
        >
          <textarea
            className={textareaClass}
            rows={4}
            value={form.concept}
            onChange={(e) => set('concept', e.target.value)}
            placeholder="例：「捨てられるはずだった一足を、世界でひとつの作品に」をテーマに制作。日常に溶け込む芸術を目指して…"
          />
        </FormField>

        <FormField
          label="特徴"
          hint="素材・技法・見た目の特徴を書いてください"
        >
          <textarea
            className={textareaClass}
            rows={3}
            value={form.features}
            onChange={(e) => set('features', e.target.value)}
            placeholder="例：アクリル絵の具で描いた後にコーティング。耐久性があり実際に履ける作品。"
          />
        </FormField>

        <FormField
          label="想定顧客"
          hint="どんな人に購入してほしいか（AI生成の精度が上がります）"
        >
          <textarea
            className={textareaClass}
            rows={2}
            value={form.targetCustomer}
            onChange={(e) => set('targetCustomer', e.target.value)}
            placeholder="例：スニーカー好きの30代男性。唯一無二のアイテムで自分らしさを表現したい人。"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="価格（円）" hint="未設定の場合は空欄">
            <input
              type="number"
              className={inputClass}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="例：35000"
              min={0}
            />
          </FormField>

          <FormField label="販売状態" required>
            <select
              className={selectClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as ArtworkStatus)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="flex items-center justify-between pt-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              この作品を削除する
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <Link
              href="/artworks"
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
