import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import {
  getCurrentShopId,
  getStockItems,
  getRecentMovements,
  computeSummary,
} from '@/src/lib/inventory/queries'
import { StockSummaryRow } from '@/src/components/stock/stock-summary-card'
import { StockList } from '@/src/components/stock/stock-list'
import { StockMovementList } from '@/src/components/stock/stock-movement-list'
import { StockEmptyState } from '@/src/components/stock/stock-empty-state'
import type { Profile } from '@/src/lib/auth/get-current-profile'

export default async function StockPage() {
  let profile: Profile

  if (isDevPreview()) {
    profile = DEV_PROFILE
  } else {
    profile = await requireRole(
      'platform_admin',
      'shop_owner',
      'shop_staff',
    )
  }

  const shopId = await getCurrentShopId(profile.id, profile.role)

  const [items, movements] = shopId
    ? await Promise.all([
        getStockItems(shopId),
        getRecentMovements(shopId),
      ])
    : [[], []]

  const summary = computeSummary(items)
  const lowStockItems = items.filter((i) => i.is_low_stock)

  return (
    <div className="space-y-6 p-4">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Stock</h1>
        {shopId && (
          <p className="mt-0.5 text-sm text-gray-400">
            {items.length} article{items.length !== 1 ? 's' : ''} dans votre inventaire
          </p>
        )}
      </div>

      {/* No shop context */}
      {!shopId && (
        <StockEmptyState
          message="Aucune boutique associée"
          detail="Ce compte n'est pas lié à une boutique. Contactez un administrateur pour configurer votre accès."
        />
      )}

      {shopId && (
        <>
          {/* 1. Stock overview */}
          <section aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Vue d&apos;ensemble
            </h2>
            <StockSummaryRow
              totalItems={summary.total_items}
              inStockCount={summary.in_stock_count}
              lowStockCount={summary.low_stock_count}
              outOfStockCount={summary.out_of_stock_count}
            />
          </section>

          {/* 2. Low stock alerts */}
          {lowStockItems.length > 0 && (
            <section aria-labelledby="alerts-heading">
              <h2 id="alerts-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-600">
                ⚠ Stock faible ({lowStockItems.length})
              </h2>
              <StockList items={items} showLowStockOnly />
            </section>
          )}

          {/* 3. Full inventory */}
          <section aria-labelledby="inventory-heading">
            <h2 id="inventory-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Inventaire complet
            </h2>
            <StockList items={items} />
          </section>

          {/* 4. Recent movements */}
          <section aria-labelledby="movements-heading">
            <h2 id="movements-heading" className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Mouvements récents
            </h2>
            <StockMovementList movements={movements} />
          </section>
        </>
      )}
    </div>
  )
}
