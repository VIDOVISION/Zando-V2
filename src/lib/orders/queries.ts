import 'server-only'
import { isDevPreview } from '@/src/lib/dev'
import { createClient } from '@/src/lib/supabase/server'
import type { CurrencyCode, DeliveryStatus, OrderStatus } from '@/src/lib/supabase/types'
import { STATUS_FILTER_MAP } from './types'
import type { Order } from './types'

const supabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function shouldSkipDb(): boolean {
  return isDevPreview() || !supabaseConfigured
}

export async function getOrders(opts: {
  tab?: string
} = {}): Promise<Order[]> {
  if (shouldSkipDb()) return []

  const supabase = await createClient()

  // RLS scopes the rows automatically — shop_owner/staff see their shop,
  // supplier sees orders directed to them, platform_admin sees all.
  let query = supabase
    .from('orders')
    .select(
      `id, shop_id, supplier_id, status, total_amount, currency, notes, created_by, created_at, updated_at,
       shop:shops(name),
       supplier:suppliers(name),
       created_by_profile:profiles(full_name),
       items:order_items(id),
       delivery:deliveries(status, scheduled_date)`,
    )
    .order('created_at', { ascending: false })

  // Apply status filter when a tab is selected
  const statuses: OrderStatus[] = STATUS_FILTER_MAP[opts.tab ?? 'all'] ?? []
  if (statuses.length > 0) {
    query = query.in('status', statuses)
  }

  const { data, error } = await query

  if (error || !data) return []

  return (data as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const shop = r.shop as Record<string, unknown> | null
    const supplier = r.supplier as Record<string, unknown> | null
    const createdByProfile = r.created_by_profile as Record<string, unknown> | null
    const items = r.items as unknown[]
    const delivery = r.delivery as Record<string, unknown> | null

    return {
      id: r.id as string,
      shop_id: r.shop_id as string,
      shop_name: (shop?.name as string) ?? '—',
      supplier_id: r.supplier_id as string,
      supplier_name: (supplier?.name as string) ?? '—',
      status: r.status as OrderStatus,
      total_amount: Number(r.total_amount ?? 0),
      currency: r.currency as CurrencyCode,
      notes: (r.notes as string | null) ?? null,
      created_by: r.created_by as string,
      created_by_name: (createdByProfile?.full_name as string) ?? '—',
      created_at: r.created_at as string,
      updated_at: r.updated_at as string,
      item_count: Array.isArray(items) ? items.length : 0,
      delivery_status: delivery ? (delivery.status as DeliveryStatus) : null,
      delivery_scheduled_date: delivery
        ? (delivery.scheduled_date as string | null) ?? null
        : null,
    } satisfies Order
  })
}
