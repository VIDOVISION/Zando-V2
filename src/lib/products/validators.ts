export type ProductFormValues = {
  name: string
  category_id: string | null
  sku: string | null
  unit: string
  description: string | null
  is_active: boolean
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | '_form', string>>

// Converts a product name to a URL-safe slug.
// Strips French diacritics before lowercasing so accented chars don't become
// percent-encoded segments (é → e, è → e, à → a, etc.).
export function toSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function validateProduct(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Le nom du produit est requis.'
  } else if (values.name.trim().length < 2) {
    errors.name = 'Le nom doit contenir au moins 2 caractères.'
  }

  if (!values.category_id) {
    errors.category_id = 'La catégorie est requise.'
  }

  if (!values.sku || !values.sku.trim()) {
    errors.sku = 'Le SKU est requis.'
  }

  if (!values.unit.trim()) {
    errors.unit = "L'unité est requise."
  }

  return errors
}
