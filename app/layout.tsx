import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Art Business OS',
  description: 'スニーカーペイント・箔画・抽象画・ワークショップのマーケティング支援システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.className}>
      <body className="bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="ml-60 min-h-screen p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
