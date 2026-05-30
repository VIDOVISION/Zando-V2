import type { ProductInventorySummary } from '@/src/lib/inventory/types'

type Props = {
  inventory: ProductInventorySummary
  unit: string
}

function StockBadge({ inventory }: { inventory: ProductInventorySummary }) {
  if (inventory.quantity_on_hand === 0) {
    return (
      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Rupture de stock
      </span>
    )
  }
  if (inventory.is_low_stock) {
    return (
      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        Stock faible
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      En stock
    </span>
  )
}

function StatBlock({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

function formatQty(qty: number, unit: string): string {
  const rounded = qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)
  return `${rounded} ${unit}`
}

function formatPrice(price: number, currency: string): string {
  return `${price.toLocaleString('fr-CD')} ${currency}`
}

export function ProductDetailInventoryCard({ inventory, unit }: Props) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Stock en boutique
        </h2>
        <StockBadge inventory={inventory} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatBlock
            label="Quantité disponible"
            value={formatQty(inventory.quantity_on_hand, unit)}
          />
          <StatBlock
            label="Seuil de réappro."
            value={
              inventory.min_quantity > 0
                ? formatQty(inventory.min_quantity, unit)
                : '—'
            }
          />
          {inventory.selling_price != null && inventory.currency && (
            <StatBlock
              label="Prix de vente"
              value={formatPrice(inventory.selling_price, inventory.currency)}
            />
          )}
        </div>
      </div>
    </section>
  )
}
