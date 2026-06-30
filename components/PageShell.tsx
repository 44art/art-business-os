type MarketingPhase = '認知' | '集客' | '販売' | 'リピーター' | '全フェーズ'

type Props = {
  title: string
  phase: MarketingPhase | MarketingPhase[]
  purpose: string
  salesContribution: string
  upcomingFeatures: string[]
  children?: React.ReactNode
}

const phaseColors: Record<MarketingPhase, string> = {
  '認知': 'bg-blue-100 text-blue-800',
  '集客': 'bg-green-100 text-green-800',
  '販売': 'bg-amber-100 text-amber-800',
  'リピーター': 'bg-purple-100 text-purple-800',
  '全フェーズ': 'bg-slate-100 text-slate-700',
}

export default function PageShell({
  title,
  phase,
  purpose,
  salesContribution,
  upcomingFeatures,
  children,
}: Props) {
  const phases = Array.isArray(phase) ? phase : [phase]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {phases.map((p) => (
            <span
              key={p}
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${phaseColors[p]}`}
            >
              {p}
            </span>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">目的</p>
            <p className="text-slate-700">{purpose}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">売上への貢献</p>
            <p className="text-slate-700">{salesContribution}</p>
          </div>
        </div>
      </div>

      {children ? (
        children
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6">
          <p className="text-sm font-semibold text-slate-500 mb-3">今後実装する機能</p>
          <ul className="space-y-2">
            {upcomingFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                  {i + 1}
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
