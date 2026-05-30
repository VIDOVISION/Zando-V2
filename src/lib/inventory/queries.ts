import 'server-only'
import { isDevPreview } from '@/src/lib/dev'
import { createClient } from '@/src/lib/supabase/server'
import type { CurrencyCode } from '@/src/lib/supabase/types'
import type { StockItem, StockMovement, StockSummary } from './types'

const supabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function shouldSkipDb(): boolean {
  return isDevPreview() || !supabaseConfigured
}

// Resolve the shop_id for the authenticated user.
// - shop_owner: their shops.id WHERE owner_id = auth.uid()
// - shop_staff: shop_staff.shop_id WHERE user_id = auth.uid()
// Returns null when the user has no shop association (e.g. supplier, platform_admin).
export async function getCurrentShopId(profileId: string, role: string): Promise<string | null> {
  if (shouldSkipDb()) return null

  const supabase = await createClient()

  if (role === 'shop_owner') {
    const { data } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', profileId)
      .eq('is_active', true)
      .limit(1)
      .single()
    return (data as unknown as { id: string } | null)?.id ?? null
  }

  if (role === 'shop_staff') {
    const { data } = await supabase
      .from('shop_staff')
      .select('shop_id')
      .eq('user_id', profileId)
      .limit(1)
      .single()
    return (data as unknown as { shop_id: string } | null)?.shop_id ?? null
  }

  return null
}

export async function getStockItems(shopId: string): Promise<StockItem[]> {
  if (shouldSkipDb()) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_items')
    .select(
      `id, shop_id, product_id, quantity_on_hand, min_quantity, selling_price, currency, updated_at,
       product:products(name, slug, sku, unit, category:product_categories(name))`,
    )
    .eq('shop_id', shopId)
    .order('updated_at', { ascending: false })

  if (error || !data) return []

  return (data as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const product = r.product as Record<string, unknown> | null
    const category = product?.category as Record<string, unknown> | null
    const qoh = Number(r.quantity_on_hand ?? 0)
    const minQ = Number(r.min_quantity ?? 0)

    return {
      id: r.id as string,
      shop_id: r.shop_id as string,
      product_id: r.product_id as string,
      product_name: (product?.name as string) ?? '',
      product_slug: (product?.slug as string) ?? '',
      sku: (product?.sku as string | null) ?? null,
      unit: (product?.unit as string) ?? 'piece',
      category_name: (category?.name as string | null) ?? null,
      quantity_on_hand: qoh,
      min_quantity: minQ,
      selling_price: r.selling_price != null ? Number(r.selling_price) : null,
      currency: (r.currency as CurrencyCode | null) ?? null,
      updated_at: r.updated_at as string,
      is_low_stock: minQ > 0 && qoh <= minQ,
    } satisfies StockItem
  })
}

export async function getRecentMovements(shopId: string, limit = 20): Promise<StockMovement[]> {
  if (shouldSkipDb()) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stock_movements')
    .select(
      `id, inventory_item_id, shop_id, product_id, movement_type, quantity, note, reference_type, created_at,
       product:products(name),
       created_by_profile:profiles(full_name)`,
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return (data as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const product = r.product as Record<string, unknown> | null
    const createdBy = r.created_by_profile as Record<string, unknown> | null

    return {
      id: r.id as string,
      inventory_item_id: r.inventory_item_id as string,
      shop_id: r.shop_id as string,
      product_id: r.product_id as string,
      product_name: (product?.name as string) ?? '',
      movement_type: r.movement_type as StockMovement['movement_type'],
      quantity: Number(r.quantity),
      note: (r.note as string | null) ?? null,
      reference_type: (r.reference_type as string | null) ?? null,
      created_by_name: (createdBy?.full_name as string) ?? 'Inconnu',
      created_at: r.created_at as string,
    } satisfies StockMovement
  })
}

export function computeSummary(items: StockItem[]): StockSummary {
  return {
    total_items: items.length,
    low_stock_count: items.filter((i) => i.is_low_stock).length,
    in_stock_count: items.filter((i) => i.quantity_on_hand > 0 && !i.is_low_stock).length,
    out_of_stock_count: items.filter((i) => i.quantity_on_hand === 0).length,
  }
}
