import type { Order } from '@/src/lib/orders/types'
import { OrderCard } from './order-card'
import { OrderEmptyState } from './order-empty-state'

type Props = {
  orders: Order[]
  filtered?: boolean
}

export function OrderList({ orders, filtered = false }: Props) {
  if (orders.length === 0) {
    return <OrderEmptyState filtered={filtered} />
  }

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
