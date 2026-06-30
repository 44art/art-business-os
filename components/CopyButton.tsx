'use client'
import { useState } from 'react'

export function CopyButton({
  text,
  label = 'コピー',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      } ${className ?? ''}`}
    >
      {copied ? 'コピー済 ✓' : label}
    </button>
  )
}
