import type { OrderStatus, DeliveryStatus, CurrencyCode } from '@/src/lib/supabase/types'

export type { OrderStatus, DeliveryStatus }

export type Order = {
  id: string
  shop_id: string
  shop_name: string         // joined from shops
  supplier_id: string
  supplier_name: string     // joined from suppliers
  status: OrderStatus
  total_amount: number
  currency: CurrencyCode
  notes: string | null
  created_by: string
  created_by_name: string   // joined from profiles
  created_at: string
  updated_at: string
  item_count: number        // count of order_items rows
  delivery_status: DeliveryStatus | null          // from deliveries (nullable — no delivery until shipped)
  delivery_scheduled_date: string | null
}

// Maps the UI tab slug to the DB order_status values it covers.
// 'pending' covers draft + submitted; 'preparing' covers the shipped/in-transit phase.
export const STATUS_FILTER_MAP: Record<string, OrderStatus[]> = {
  all: [],
  pending: ['draft', 'submitted'],
  confirmed: ['confirmed'],
  preparing: ['shipped'],
  delivered: ['delivered'],
  cancelled: ['cancelled'],
}

export const ORDER_TABS = [
  { id: 'all',       label: 'Toutes' },
  { id: 'pending',   label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'preparing', label: 'Préparation' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
] as const
