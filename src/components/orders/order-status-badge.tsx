import type { OrderStatus } from '@/src/lib/orders/types'

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  draft:     { label: 'Brouillon',   className: 'bg-gray-100 text-gray-600' },
  submitted: { label: 'Soumise',     className: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmée',   className: 'bg-teal-100 text-teal-700' },
  shipped:   { label: 'Expédiée',    className: 'bg-amber-100 text-amber-700' },
  delivered: { label: 'Livrée',      className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Annulée',     className: 'bg-red-100 text-red-600' },
}

type Props = {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft

  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
