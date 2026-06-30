'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Artwork, ArtworkStatus } from '@/types'
import { getArtworks } from '@/lib/storage'

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

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])

  useEffect(() => {
    setArtworks(getArtworks())
  }, [])

  const selling = artworks.filter((a) => a.status === 'selling').length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">作品管理</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">認知・販売</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            SNS投稿・LP・コンテンツ生成のAI素材として管理します
          </p>
        </div>
        <Link
          href="/artworks/new"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          + 作品を登録する
        </Link>
      </div>

      {artworks.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{artworks.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">登録作品数</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{selling}</p>
            <p className="text-xs text-slate-500 mt-0.5">販売中</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{artworks.length - selling}</p>
            <p className="text-xs text-slate-500 mt-0.5">売却済・非公開</p>
          </div>
        </div>
      )}

      {artworks.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500 font-medium">作品がまだ登録されていません</p>
          <p className="text-sm text-slate-400 mt-1">作品を登録するとSNS投稿・LP・コンテンツ生成に活用できます</p>
          <Link
            href="/artworks/new"
            className="inline-block mt-4 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            最初の作品を登録する
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {artworks.map((artwork) => (
            <Link
              key={artwork.id}
              href={`/artworks/${artwork.id}/edit`}
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 truncate">
                    {artwork.title}
                  </h3>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[artwork.status]}`}>
                    {statusLabel[artwork.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{artwork.genre}</span>
                  {artwork.price && (
                    <>
                      <span>·</span>
                      <span>¥{artwork.price.toLocaleString()}</span>
                    </>
                  )}
                </div>
                {artwork.concept && (
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{artwork.concept}</p>
                )}
              </div>
              <span className="flex-shrink-0 text-slate-400 group-hover:text-indigo-500 text-sm mt-0.5">編集 →</span>
            </Link>
          ))}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-blue-900 mb-1">次のステップ：AIマーケティング分析</p>
            <p className="text-xs text-blue-700 mb-3">
              登録した作品をもとに、認知・販売フェーズの課題と改善施策をAIが分析します。
              分析後にペルソナを作成すると、コンテンツ・LP・SNS戦略を生成できます。
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/analysis"
                className="text-xs font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                AIマーケティング分析へ →
              </Link>
              <Link
                href="/personas/new"
                className="text-xs font-medium px-3 py-1.5 bg-white text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                ペルソナを作成する →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
