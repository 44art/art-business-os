'use client'

import { useState, useEffect } from 'react'
import type { Brand } from '@/types'
import { getBrand, saveBrand } from '@/lib/storage'
import FormField, { inputClass, textareaClass } from '@/components/FormField'

type FormState = {
  name: string
  activities: string
  products: string
  strengths: string
  targetCustomer: string
  priceRange: string
  salesChannel: string
}

const emptyForm: FormState = {
  name: '',
  activities: '',
  products: '',
  strengths: '',
  targetCustomer: '',
  priceRange: '',
  salesChannel: '',
}

export default function BrandPage() {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const data = getBrand()
    setBrand(data)
    if (!data) setIsEditing(true)
  }, [])

  function startEdit() {
    if (brand) {
      setForm({
        name: brand.name,
        activities: brand.activities,
        products: brand.products,
        strengths: brand.strengths,
        targetCustomer: brand.targetCustomer,
        priceRange: brand.priceRange,
        salesChannel: brand.salesChannel,
      })
    }
    setSaved(false)
    setError('')
    setIsEditing(true)
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('ブランド名は必須です')
      return
    }
    if (!form.activities.trim()) {
      setError('活動内容は必須です')
      return
    }
    const now = new Date().toISOString()
    const newBrand: Brand = {
      id: brand?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      activities: form.activities.trim(),
      products: form.products.trim(),
      strengths: form.strengths.trim(),
      targetCustomer: form.targetCustomer.trim(),
      priceRange: form.priceRange.trim(),
      salesChannel: form.salesChannel.trim(),
      updatedAt: now,
    }
    saveBrand(newBrand)
    setBrand(newBrand)
    setSaved(true)
    setIsEditing(false)
  }

  const fieldLabel: Record<keyof FormState, string> = {
    name: 'ブランド名',
    activities: '活動内容',
    products: '主な商品・サービス',
    strengths: '強み',
    targetCustomer: '想定顧客',
    priceRange: '価格帯',
    salesChannel: '販売導線',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ブランド管理</h1>
          <p className="text-sm text-slate-500 mt-1">すべてのAI生成の軸となるブランド情報を登録します</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">認知</span>
      </div>

      {!isEditing && brand && (
        <div className="space-y-4">
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
              ブランド情報を保存しました
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{brand.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  最終更新: {new Date(brand.updatedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
              <button
                onClick={startEdit}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded-lg px-3 py-1.5 transition-colors"
              >
                編集する
              </button>
            </div>

            <dl className="space-y-4">
              {[
                { key: 'activities', label: '活動内容' },
                { key: 'products', label: '主な商品・サービス' },
                { key: 'strengths', label: '強み' },
                { key: 'targetCustomer', label: '想定顧客' },
                { key: 'priceRange', label: '価格帯' },
                { key: 'salesChannel', label: '販売導線' },
              ].map(({ key, label }) => {
                const value = brand[key as keyof Brand] as string
                return value ? (
                  <div key={key} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                    <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</dt>
                    <dd className="text-sm text-slate-700 whitespace-pre-wrap">{value}</dd>
                  </div>
                ) : null
              })}
            </dl>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4">
            <p className="text-xs font-semibold text-indigo-700 mb-1">AI生成への活用</p>
            <p className="text-sm text-indigo-600">
              このブランド情報は、コンテンツ生成・LP作成・LINE活用のAI機能で自動的に参照されます。
              変更した場合は次回の生成から反映されます。
            </p>
          </div>
        </div>
      )}

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <FormField label="ブランド名" required>
            <input
              type="text"
              className={inputClass}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="例：KEN CUSTOM SNEAKERS"
            />
          </FormField>

          <FormField
            label="活動内容"
            required
            hint="スニーカーペイント・箔画など、どんな活動をしているか"
          >
            <textarea
              className={textareaClass}
              rows={3}
              value={form.activities}
              onChange={(e) => set('activities', e.target.value)}
              placeholder="例：スニーカーのカスタムペイントと箔画の原画制作を行っています。ワークショップも定期開催しています。"
            />
          </FormField>

          <FormField
            label="主な商品・サービス"
            hint="販売している作品やWSの種類"
          >
            <textarea
              className={textareaClass}
              rows={3}
              value={form.products}
              onChange={(e) => set('products', e.target.value)}
              placeholder="例：スニーカーカスタム（1足35,000円〜）、箔画原画（50,000円〜）、体験WS（5,000円/人）"
            />
          </FormField>

          <FormField
            label="強み"
            hint="他との違い、独自性"
          >
            <textarea
              className={textareaClass}
              rows={3}
              value={form.strengths}
              onChange={(e) => set('strengths', e.target.value)}
              placeholder="例：10年以上の経験。一点もの作品。実際に履けるクオリティ。丁寧なアフターフォロー。"
            />
          </FormField>

          <FormField
            label="想定顧客"
            hint="どんな人に購入・参加してほしいか"
          >
            <textarea
              className={textareaClass}
              rows={3}
              value={form.targetCustomer}
              onChange={(e) => set('targetCustomer', e.target.value)}
              placeholder="例：スニーカー好きの20〜40代。ギフトを探している人。アート好きのインテリア好き。"
            />
          </FormField>

          <FormField label="価格帯" hint="例：3,000円〜50,000円">
            <input
              type="text"
              className={inputClass}
              value={form.priceRange}
              onChange={(e) => set('priceRange', e.target.value)}
              placeholder="例：WS 5,000円〜、作品 35,000円〜"
            />
          </FormField>

          <FormField
            label="販売導線"
            hint="どこから購入・申込につなげているか"
          >
            <textarea
              className={textareaClass}
              rows={2}
              value={form.salesChannel}
              onChange={(e) => set('salesChannel', e.target.value)}
              placeholder="例：Instagram → プロフリンク → LINE公式 → DM受付"
            />
          </FormField>

          <div className="flex gap-3 justify-end pt-2">
            {brand && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg"
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              {brand ? '更新する' : '保存する'}
            </button>
          </div>
        </form>
      )}

      {!brand && !isEditing && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-slate-500">ブランド情報がまだ登録されていません</p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            ブランドを登録する
          </button>
        </div>
      )}
    </div>
  )
}
