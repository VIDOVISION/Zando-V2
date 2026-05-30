import 'server-only'
import { createClient } from '@/src/lib/supabase/server'
import type { Product, ProductCategory } from './types'

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const configured =
    Boolean(url) &&
    Boolean(key) &&
    !url.includes('your-project-ref')  // guard against unconfigured placeholder
  return { url, key, configured }
}

function warnDev(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[zando/products] ${message}`, detail ?? '')
  }
}

export async function getProducts(opts: {
  search?: string
  categoryId?: string
} = {}): Promise<Product[]> {
  const { configured, url } = getSupabaseConfig()

  if (!configured) {
    warnDev(
      'Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local',
      { url: url || '(empty)' },
    )
    return []
  }

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

  if (error) {
    warnDev('getProducts query error', { code: error.code, message: error.message, hint: error.hint })
    return []
  }

  if (!data) {
    warnDev('getProducts returned null data (no error)')
    return []
  }

  return data as unknown as Product[]
}

export async function getProductById(id: string): Promise<Product | null> {
  const { configured } = getSupabaseConfig()
  if (!configured) return null

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      'id, category_id, name, slug, description, unit, sku, is_active, image_url, created_at, updated_at, category:product_categories(id, name, slug)',
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      warnDev('getProductById error', { id, code: error.code, message: error.message })
    }
    return null
  }

  return data as unknown as Product
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const { configured } = getSupabaseConfig()
  if (!configured) return []

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('product_categories')
    .select('id, name, slug')
    .order('name', { ascending: true })

  if (error) {
    warnDev('getProductCategories query error', { code: error.code, message: error.message })
    return []
  }

  return (data ?? []) as unknown as ProductCategory[]
}
