import Link from 'next/link'
import type { StockItem } from '@/src/lib/inventory/types'

type Props = {
  item: StockItem
}

export function StockItemCard({ item }: Props) {
  const availableStock = item.quantity_on_hand // reserved_stock not tracked yet

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        item.quantity_on_hand === 0
          ? 'border-red-200'
          : item.is_low_stock
            ? 'border-amber-200'
            : 'border-gray-200'
      }`}
    >
      {/* Header: product name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{item.product_name}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {item.category_name ?? 'Sans catégorie'} · {item.unit}
          </p>
        </div>
        <StatusBadge item={item} />
      </div>

      {/* SKU */}
      {item.sku && (
        <p className="mt-2 text-xs text-blue-600">SKU: {item.sku}</p>
      )}

      {/* Stock numbers */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
        <StockStat label="En stock" value={item.quantity_on_hand} unit={item.unit} />
        <StockStat label="Disponible" value={availableStock} unit={item.unit} />
        <StockStat
          label="Réappro. min"
          value={item.min_quantity > 0 ? item.min_quantity : null}
          unit={item.unit}
        />
      </div>

      {/* Selling price */}
      {item.selling_price != null && (
        <p className="mt-2 text-xs text-gray-500">
          Prix de vente:{' '}
          <span className="font-medium text-gray-800">
            {item.selling_price.toLocaleString('fr-CD')} {item.currency ?? ''}
          </span>
        </p>
      )}

      {/* Adjust action */}
      <div className="mt-3 border-t border-gray-100 pt-3">
        <Link
          href={`/stock/${item.id}/adjust`}
          className="text-xs font-medium text-[#0d9488] hover:underline"
        >
          Ajuster →
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ item }: { item: StockItem }) {
  if (item.quantity_on_hand === 0) {
    return (
      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Rupture
      </span>
    )
  }
  if (item.is_low_stock) {
    return (
      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        Stock faible
      </span>
    )
  }
  return (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      En stock
    </span>
  )
}

function StockStat({
  label,
  value,
  unit,
}: {
  label: string
  value: number | null
  unit: string
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      {value != null ? (
        <span className="text-sm font-semibold tabular-nums text-gray-900">
          {value % 1 === 0 ? value.toFixed(0) : value.toFixed(2)}{' '}
          <span className="text-xs font-normal text-gray-500">{unit}</span>
        </span>
      ) : (
        <span className="text-sm text-gray-400">—</span>
      )}
    </div>
  )
}
