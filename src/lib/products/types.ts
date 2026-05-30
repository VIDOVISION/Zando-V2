export type ProductCategory = {
  id: string
  name: string
  slug: string
}

export type Product = {
  id: string
  category_id: string | null
  category: ProductCategory | null
  name: string
  slug: string
  description: string | null
  unit: string
  sku: string | null
  is_active: boolean
  image_url: string | null
  created_at: string
  updated_at: string
}
