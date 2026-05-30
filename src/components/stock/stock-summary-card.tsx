type SummaryCardProps = {
  label: string
  value: number
  variant?: 'default' | 'warning' | 'danger'
}

function SummaryCard({ label, value, variant = 'default' }: SummaryCardProps) {
  const colors = {
    default: 'bg-white text-gray-900',
    warning: 'bg-amber-50 text-amber-800',
    danger: 'bg-red-50 text-red-700',
  }

  return (
    <div className={`flex flex-col gap-0.5 rounded-xl border border-gray-200 px-4 py-3 ${colors[variant]}`}>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

type Props = {
  totalItems: number
  inStockCount: number
  lowStockCount: number
  outOfStockCount: number
}

export function StockSummaryRow({ totalItems, inStockCount, lowStockCount, outOfStockCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <SummaryCard label="Articles total" value={totalItems} />
      <SummaryCard label="En stock" value={inStockCount} />
      <SummaryCard label="Stock faible" value={lowStockCount} variant={lowStockCount > 0 ? 'warning' : 'default'} />
      <SummaryCard label="Rupture" value={outOfStockCount} variant={outOfStockCount > 0 ? 'danger' : 'default'} />
    </div>
  )
}
