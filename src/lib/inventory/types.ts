import type { MovementType, CurrencyCode } from '@/src/lib/supabase/types'

// One row per (shop, product) pair — source of truth for current stock.
export type StockItem = {
  id: string
  shop_id: string
  product_id: string
  // Joined from products
  product_name: string
  product_slug: string
  sku: string | null
  unit: string
  category_name: string | null
  // Inventory columns
  quantity_on_hand: number
  min_quantity: number
  selling_price: number | null
  currency: CurrencyCode | null
  updated_at: string
  // Derived
  is_low_stock: boolean // quantity_on_hand <= min_quantity && min_quantity > 0
}

// One row in stock_movements — append-only audit trail.
export type StockMovement = {
  id: string
  inventory_item_id: string
  shop_id: string
  product_id: string
  product_name: string   // joined from products
  movement_type: MovementType
  quantity: number
  note: string | null
  reference_type: string | null
  created_by_name: string  // joined from profiles
  created_at: string
}

// Minimal inventory snapshot shown on product detail pages.
export type ProductInventorySummary = {
  quantity_on_hand: number
  min_quantity: number
  selling_price: number | null
  currency: CurrencyCode | null
  is_low_stock: boolean
}

// Aggregated summary for the stock overview row.
export type StockSummary = {
  total_items: number
  low_stock_count: number
  in_stock_count: number
  out_of_stock_count: number
}
