'use server'

import { redirect } from 'next/navigation'
import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import { getCurrentProfile } from '@/src/lib/auth/get-current-profile'
import { createClient } from '@/src/lib/supabase/server'
import { validateAddInventoryItem } from './validators'
import type { AddInventoryItemErrors } from './validators'
import type { CurrencyCode } from '@/src/lib/supabase/types'

export type AddInventoryItemState = {
  errors?: AddInventoryItemErrors
  message?: string
}

function warnDev(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[zando/inventory/actions] ${message}`, detail ?? '')
  }
}

export async function addProductToInventory(
  _prevState: AddInventoryItemState,
  formData: FormData,
): Promise<AddInventoryItemState> {
  // Auth: check the REAL Supabase session first, even in dev preview.
  // isDevPreview() only bypasses the redirect-to-login UI gate, not the
  // role check. A real authenticated platform_admin must be present for
  // DB writes to succeed under RLS.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // A real session exists — verify the user's actual role from public.profiles.
    const profile = await getCurrentProfile()

    if (!profile) {
      warnDev('no profile row found for authenticated user', { userId: user.id })
      return { message: 'Profil introuvable. Contactez un administrateur.' }
    }

    if (profile.role !== 'platform_admin') {
      warnDev('access denied — insufficient role', {
        profileId: profile.id,
        role: profile.role,
      })
      return { message: 'Non autorisé. Seul un administrateur peut gérer l\'inventaire.' }
    }
  } else if (!isDevPreview()) {
    // Production with no session: deny immediately.
    return { message: 'Vous n\'êtes pas connecté.' }
  }
  // isDevPreview() + no real session: proceed — DB operations will fail at
  // RLS/GRANT level and return a clear error message below.

  // Parse form values
  const rawSellingPrice = (formData.get('selling_price') as string | null) ?? ''
  const values = {
    product_id: (formData.get('product_id') as string | null) ?? '',
    shop_id: (formData.get('shop_id') as string | null) ?? '',
    opening_quantity: Number(formData.get('opening_quantity') ?? 0),
    min_quantity: Number(formData.get('min_quantity') ?? 0),
    selling_price: rawSellingPrice.trim() ? Number(rawSellingPrice) : null,
    currency: ((formData.get('currency') as string | null) || 'CDF') as CurrencyCode,
    note: ((formData.get('note') as string | null) ?? '').trim() || null,
  }

  const errors = validateAddInventoryItem(values)
  if (Object.keys(errors).length > 0) return { errors }

  // Resolve creator ID: real user from session, or dev profile as fallback.
  const createdById = user?.id ?? DEV_PROFILE.id

  // ── Step 1: Insert inventory item (quantity_on_hand starts at 0) ──────────
  const invPayload = {
    shop_id: values.shop_id,
    product_id: values.product_id,
    quantity_on_hand: 0,
    min_quantity: values.min_quantity,
    selling_price: values.selling_price,
    currency: values.selling_price != null ? values.currency : null,
  }

  const { data: invItem, error: invError } = (await supabase
    .from('inventory_items')
    .insert(invPayload as never)
    .select('id')
    .single()) as unknown as {
    data: { id: string } | null
    error: { code: string; message: string } | null
  }

  if (invError) {
    if (invError.code === '42501') {
      warnDev('inventory_items INSERT permission denied — check migration 0010 is applied', {
        userId: user?.id ?? null,
      })
      return {
        message:
          'Accès refusé sur l\'inventaire. Vérifiez que la migration 0010 a été appliquée en base.',
      }
    }
    if (invError.code === '23505') {
      return { message: 'Ce produit est déjà dans l\'inventaire de cette boutique.' }
    }
    return { message: `Erreur (inventaire): ${invError.message}` }
  }

  if (!invItem) {
    return { message: 'L\'article a été créé mais son identifiant est introuvable.' }
  }

  // ── Step 2: Insert opening stock movement (if quantity > 0) ───────────────
  if (values.opening_quantity > 0) {
    const smPayload = {
      inventory_item_id: invItem.id,
      shop_id: values.shop_id,
      product_id: values.product_id,
      movement_type: 'purchase_in',
      quantity: values.opening_quantity,
      reference_type: 'manual',
      note: values.note ?? 'Stock d\'ouverture',
      created_by: createdById,
    }

    const { error: smError } = (await supabase
      .from('stock_movements')
      .insert(smPayload as never)) as unknown as {
      error: { code: string; message: string } | null
    }

    if (smError) {
      warnDev('stock_movements INSERT failed — cleaning up inventory row', {
        invItemId: invItem.id,
        code: smError.code,
        message: smError.message,
      })
      // Best-effort cleanup: remove the orphan inventory row.
      await (supabase.from('inventory_items').delete().eq('id', invItem.id) as unknown)
      return { message: `Mouvement de stock échoué: ${smError.message}` }
    }
  }

  redirect('/stock')
}
