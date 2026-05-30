import Link from 'next/link'
import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { getOrders } from '@/src/lib/orders/queries'
import { ORDER_TABS } from '@/src/lib/orders/types'
import { OrderList } from '@/src/components/orders/order-list'
import type { Profile } from '@/src/lib/auth/get-current-profile'

type SearchParams = Promise<{ tab?: string }>

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  let profile: Profile

  if (isDevPreview()) {
    profile = DEV_PROFILE
  } else {
    profile = await requireRole(
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    )
  }

  // Suppress unused variable lint warning — profile will drive role-aware UI in Phase 5
  void profile

  const { tab } = await searchParams
  const activeTab = ORDER_TABS.find((t) => t.id === tab)?.id ?? 'all'

  const orders = await getOrders({ tab: activeTab })
  const isFiltered = activeTab !== 'all'

  return (
    <div className="flex flex-col p-4">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900">Commandes</h1>
        {orders.length > 0 && (
          <p className="mt-0.5 text-sm text-gray-400">
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Tab strip — horizontally scrollable on mobile */}
      <nav
        className="mb-5 -mx-4 flex overflow-x-auto px-4 gap-1 pb-1 scrollbar-none"
        aria-label="Filtrer les commandes"
      >
        {ORDER_TABS.map((t) => {
          const isActive = t.id === activeTab
          const href = t.id === 'all' ? '/orders' : `/orders?tab=${t.id}`
          return (
            <Link
              key={t.id}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0d9488] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>

      {/* Order list */}
      <OrderList orders={orders} filtered={isFiltered} />
    </div>
  )
}
