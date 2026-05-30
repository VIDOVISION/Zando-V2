import 'server-only'
import { isDevPreview } from '@/src/lib/dev'
import { createClient } from '@/src/lib/supabase/server'
import type { Product, ProductCategory } from './types'

const supabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function shouldSkipDb(): boolean {
  return isDevPreview() || !supabaseConfigured
}

export async function getProducts(opts: {
  search?: string
  categoryId?: string
} = {}): Promise<Product[]> {
  if (shouldSkipDb()) return []

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(
      'id, category_id, name, slug, description, unit, sku, is_active, image_url, created_at, updated_at, category:product_categories(id, name, slug)',
    )
    .order('name', { ascending: true })

  if (opts.search) {
    query = query.ilike('name', `%${opts.search}%`)
  }

  if (opts.categoryId) {
    query = query.eq('category_id', opts.categoryId)
  }

  const { data, error } = await query

  if (error || !data) return []

  return (data as unknown as Product[])
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  if (shouldSkipDb()) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error || !data) return []

  return data as unknown as ProductCategory[]
}
