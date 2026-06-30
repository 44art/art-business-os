'use client'
import type { UsageStatus } from '@/types'

const STATUS_CONFIG: Record<UsageStatus, { label: string; color: string }> = {
  unused:   { label: '未使用',   color: 'bg-slate-100 text-slate-500' },
  planned:  { label: '使用予定', color: 'bg-blue-100 text-blue-700' },
  used:     { label: '使用済み', color: 'bg-green-100 text-green-700' },
  revising: { label: '修正中',   color: 'bg-amber-100 text-amber-700' },
}
const STATUS_ORDER: UsageStatus[] = ['unused', 'planned', 'used', 'revising']

export function UsageStatusBadge({
  status,
  onChange,
}: {
  status?: UsageStatus
  onChange?: (next: UsageStatus) => void
}) {
  const current = status ?? 'unused'
  const cfg = STATUS_CONFIG[current]

  function handleClick() {
    if (!onChange) return
    const idx = STATUS_ORDER.indexOf(current)
    onChange(STATUS_ORDER[(idx + 1) % STATUS_ORDER.length])
  }

  return (
    <button
      type="button"
      onClick={onChange ? handleClick : undefined}
      title={onChange ? 'クリックで変更' : undefined}
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${
        onChange ? 'cursor-pointer hover:opacity-75' : 'cursor-default'
      } transition-opacity`}
    >
      {cfg.label}
    </button>
  )
}
