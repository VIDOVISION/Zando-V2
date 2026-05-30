import type { CurrencyCode } from '@/src/lib/supabase/types'

export type AddInventoryItemValues = {
  product_id: string
  shop_id: string
  opening_quantity: number
  min_quantity: number
  selling_price: number | null
  currency: CurrencyCode
  note: string | null
}

export type AddInventoryItemErrors = Partial<
  Record<keyof AddInventoryItemValues | '_form', string>
>

export function validateAddInventoryItem(
  values: AddInventoryItemValues,
): AddInventoryItemErrors {
  const errors: AddInventoryItemErrors = {}

  if (!values.product_id) errors.product_id = 'Sélectionnez un produit.'
  if (!values.shop_id) errors.shop_id = 'Sélectionnez une boutique.'

  if (isNaN(values.opening_quantity) || values.opening_quantity < 0) {
    errors.opening_quantity = 'La quantité doit être un nombre >= 0.'
  }

  if (isNaN(values.min_quantity) || values.min_quantity < 0) {
    errors.min_quantity = 'La quantité minimale doit être >= 0.'
  }

  if (values.selling_price !== null) {
    if (isNaN(values.selling_price) || values.selling_price < 0) {
      errors.selling_price = 'Le prix de vente doit être >= 0.'
    }
  }

  return errors
}
