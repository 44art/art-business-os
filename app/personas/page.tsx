'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Persona } from '@/types'
import { getPersonas } from '@/lib/storage'

const SOURCE_LABEL: Record<string, string> = {
  brand: 'ブランド',
  artwork: '作品',
  workshop: 'WS',
}

const SOURCE_COLOR: Record<string, string> = {
  brand: 'bg-indigo-100 text-indigo-700',
  artwork: 'bg-amber-100 text-amber-700',
  workshop: 'bg-green-100 text-green-700',
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])

  useEffect(() => {
    setPersonas(getPersonas())
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">ペルソナ管理</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">認知・集客</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            「誰に向けて売るか」を定義し、コンテンツ生成・LP・LINE配信の精度を上げます
          </p>
        </div>
        <Link
          href="/personas/new"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          + ペルソナを作成する
        </Link>
      </div>

      {/* 使い方ガイド（ペルソナがない場合は大きく） */}
      {personas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-600 font-medium text-lg mb-2">ペルソナがまだ作成されていません</p>
          <p className="text-sm text-slate-400 mb-1">
            ブランド・作品・WSの情報をもとに「誰に向けて発信するか」を定義します
          </p>
          <p className="text-xs text-slate-400 mb-6">
            ペルソナを作成すると、SNS投稿・LP・LINE配信の言葉がその人に刺さる表現になります
          </p>
          <Link
            href="/personas/new"
            className="inline-block px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
          >
            最初のペルソナを作成する
          </Link>
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{personas.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">ペルソナ数</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">
                {personas.filter((p) => p.sourceType === 'brand').length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">ブランド軸</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {personas.filter((p) => p.sourceType === 'artwork' || p.sourceType === 'workshop').length}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">作品・WS軸</p>
            </div>
          </div>

          {/* ペルソナ一覧 */}
          <div className="space-y-3">
            {personas.map((persona) => (
              <Link
                key={persona.id}
                href={`/personas/${persona.id}/edit`}
                className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700">
                      {persona.name}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLOR[persona.sourceType]}`}>
                      {SOURCE_LABEL[persona.sourceType]}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-2">
                    対象：{persona.sourceName}
                    {persona.age && `${persona.age}　`}
                    {persona.occupation && persona.occupation}
                  </p>

                  {/* ニーズ・欲求のプレビュー */}
                  {persona.desires.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {persona.desires.slice(0, 3).map((d, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {d.length > 20 ? d.slice(0, 20) + '…' : d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* チャネル */}
                  {persona.usedChannels.length > 0 && (
                    <div className="flex gap-1.5">
                      {persona.usedChannels.map((ch, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
                          {ch}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="flex-shrink-0 text-slate-400 group-hover:text-indigo-500 text-sm mt-0.5">
                  編集 →
                </span>
              </Link>
            ))}
          </div>

          {/* 次のステップ案内 */}
          <div className="mt-8 bg-indigo-50 border border-indigo-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-indigo-900 mb-1">次のステップ：コンテンツ生成</p>
            <p className="text-xs text-indigo-700 mb-3">
              保存したペルソナをもとに、SNS投稿文・告知文・販売導線用文章を生成できます
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/content"
                className="inline-block px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                コンテンツを生成する →
              </Link>
              <Link
                href="/analysis"
                className="inline-block px-4 py-2 text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-lg transition-colors"
              >
                AIマーケティング分析へ →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
