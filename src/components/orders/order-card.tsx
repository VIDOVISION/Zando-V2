import type { Order } from '@/src/lib/orders/types'
import { OrderStatusBadge } from './order-status-badge'

type Props = {
  order: Order
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toLocaleString('fr-CD')} ${currency}`
}

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  pending:    'Livraison en attente',
  in_transit: 'En transit',
  delivered:  'Livraison confirmée',
  failed:     'Échec de livraison',
}

export function OrderCard({ order }: Props) {
  const ref = `#${order.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Top row: reference + status */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-gray-800">{ref}</span>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* Parties */}
      <div className="mt-2 space-y-0.5">
        <p className="text-sm text-gray-700">
          <span className="text-gray-400">Fournisseur: </span>
          {order.supplier_name}
        </p>
        <p className="text-xs text-gray-400">
          <span>Boutique: </span>
          {order.shop_name}
        </p>
      </div>

      {/* Amount + item count */}
      <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-sm">
        <span className="font-semibold text-gray-900">
          {formatAmount(order.total_amount, order.currency)}
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">
          {order.item_count} article{order.item_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Date + delivery status */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
        <span>{formatDate(order.created_at)}</span>
        {order.delivery_status && (
          <>
            <span>·</span>
            <span className="text-amber-600">
              {DELIVERY_STATUS_LABEL[order.delivery_status] ?? order.delivery_status}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
