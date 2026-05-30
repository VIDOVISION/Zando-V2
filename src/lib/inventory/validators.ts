import type { CurrencyCode, MovementType } from '@/src/lib/supabase/types'

// Types that reduce stock — used for pre-insert availability check.
export const OUTBOUND_MOVEMENT_TYPES: MovementType[] = [
  'sale_out',
  'adjustment_out',
  'damage',
  'transfer_out',
]

export type AdjustStockValues = {
  movement_type: MovementType
  quantity: number
  note: string | null
}

export type AdjustStockErrors = Partial<Record<keyof AdjustStockValues | '_form', string>>

export function validateAdjustStock(values: AdjustStockValues): AdjustStockErrors {
  const errors: AdjustStockErrors = {}

  if (!values.movement_type) {
    errors.movement_type = 'Sélectionnez un type de mouvement.'
  }

  if (isNaN(values.quantity) || values.quantity <= 0) {
    errors.quantity = 'La quantité doit être un nombre > 0.'
  }

  return errors
}


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
