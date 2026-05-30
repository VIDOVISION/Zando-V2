import type { StockItem } from '@/src/lib/inventory/types'
import { StockItemCard } from './stock-item-card'
import { StockEmptyState } from './stock-empty-state'

type Props = {
  items: StockItem[]
  showLowStockOnly?: boolean
}

export function StockList({ items, showLowStockOnly = false }: Props) {
  const displayed = showLowStockOnly ? items.filter((i) => i.is_low_stock) : items

  if (displayed.length === 0) {
    return showLowStockOnly ? (
      <p className="text-sm text-gray-400">Aucun article en stock faible.</p>
    ) : (
      <StockEmptyState />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {displayed.map((item) => (
        <StockItemCard key={item.id} item={item} />
      ))}
    </div>
  )
}
