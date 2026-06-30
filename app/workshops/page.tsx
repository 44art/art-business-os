'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Workshop, WorkshopStatus, WorkshopFormat } from '@/types'
import { getWorkshops } from '@/lib/storage'

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

const formatLabel: Record<WorkshopFormat, string> = {
  'in-person': '対面',
  'online': 'オンライン',
  'offsite': '出張',
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])

  useEffect(() => {
    setWorkshops(getWorkshops())
  }, [])

  const openCount = workshops.filter((w) => w.status === 'open').length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">ワークショップ管理</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">集客・リピーター</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            集客LP・SNS・LINE配信のAI素材として管理します
          </p>
        </div>
        <Link
          href="/workshops/new"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
        >
          + WSを登録する
        </Link>
      </div>

      {workshops.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{workshops.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">登録WS数</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{openCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">募集中</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{workshops.length - openCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">下書き・終了・満員</p>
          </div>
        </div>
      )}

      {workshops.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-slate-500 font-medium">ワークショップがまだ登録されていません</p>
          <p className="text-sm text-slate-400 mt-1">WSを登録すると集客LP・SNS・LINE配信の素材になります</p>
          <Link
            href="/workshops/new"
            className="inline-block mt-4 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            最初のWSを登録する
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((ws) => (
            <Link
              key={ws.id}
              href={`/workshops/${ws.id}/edit`}
              className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 truncate">
                    {ws.title}
                  </h3>
                  <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[ws.status]}`}>
                    {statusLabel[ws.status]}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatLabel[ws.format]}</span>
                  {ws.price > 0 && (
                    <>
                      <span>·</span>
                      <span>¥{ws.price.toLocaleString()}/人</span>
                    </>
                  )}
                  {ws.duration && (
                    <>
                      <span>·</span>
                      <span>{ws.duration}</span>
                    </>
                  )}
                </div>
                {ws.description && (
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{ws.description}</p>
                )}
              </div>
              <span className="flex-shrink-0 text-slate-400 group-hover:text-indigo-500 text-sm mt-0.5">編集 →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
