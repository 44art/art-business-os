'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
}

type NavGroup = {
  title?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [{ label: 'ダッシュボード', href: '/' }],
  },
  {
    title: '素材登録',
    items: [
      { label: 'ブランド管理', href: '/brand' },
      { label: '作品管理', href: '/artworks' },
      { label: 'WS管理', href: '/workshops' },
    ],
  },
  {
    title: 'マーケティング分析',
    items: [
      { label: 'AI分析', href: '/analysis' },
      { label: 'ペルソナ', href: '/personas' },
    ],
  },
  {
    title: 'コンテンツ作成',
    items: [
      { label: 'コンテンツ生成', href: '/content' },
      { label: 'LP作成', href: '/lp' },
      { label: 'LINE活用', href: '/line' },
      { label: 'SNS戦略', href: '/sns-strategy' },
    ],
  },
  {
    items: [
      { label: 'AIコンサルタント', href: '/consultant' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-slate-900 flex flex-col z-10">
      <div className="px-4 py-5 border-b border-slate-700">
        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Art Business OS</p>
        <p className="text-slate-200 text-sm mt-0.5">マーケティング支援</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? 'mt-1' : ''}>
            {groupIndex > 0 && groupIndex < navGroups.length && (
              <div className="mx-2 my-2 border-t border-slate-700" />
            )}
            {group.title && (
              <p className="px-3 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-500">Ver.1.0.0 — Phase2</p>
      </div>
    </aside>
  )
}
