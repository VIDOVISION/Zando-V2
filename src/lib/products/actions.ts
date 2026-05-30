'use server'

import { redirect } from 'next/navigation'
import { isDevPreview } from '@/src/lib/dev'
import { getCurrentProfile } from '@/src/lib/auth/get-current-profile'
import { createClient } from '@/src/lib/supabase/server'
import { validateProduct, toSlug } from './validators'
import type { ProductFormValues, ProductFormErrors } from './validators'

export type CreateProductState = {
  errors?: ProductFormErrors
  message?: string
}

function warnDev(message: string, detail?: unknown) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[zando/products/actions] ${message}`, detail ?? '')
  }
}

export async function createProduct(
  _prevState: CreateProductState,
  formData: FormData,
): Promise<CreateProductState> {
  // Auth: check the REAL Supabase session first, even in dev preview.
  // isDevPreview() only bypasses the redirect-to-login UI gate.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const profile = await getCurrentProfile()
    if (!profile) {
      warnDev('no profile row found for authenticated user', { userId: user.id })
      return { message: 'Profil introuvable. Contactez un administrateur.' }
    }
    if (profile.role !== 'platform_admin') {
      warnDev('access denied — insufficient role', { profileId: profile.id, role: profile.role })
      return { message: 'Non autorisé. Seul un administrateur peut créer des produits.' }
    }
  } else if (!isDevPreview()) {
    return { message: 'Vous n\'êtes pas connecté.' }
  }

  // Parse form data
  const rawSku = (formData.get('sku') as string | null) ?? ''
  const rawDescription = (formData.get('description') as string | null) ?? ''
  const rawCategoryId = (formData.get('category_id') as string | null) ?? ''

  const values: ProductFormValues = {
    name: (formData.get('name') as string) ?? '',
    category_id: rawCategoryId.trim() || null,
    sku: rawSku.trim() || null,
    unit: (formData.get('unit') as string) ?? '',
    description: rawDescription.trim() || null,
    is_active: formData.get('is_active') !== 'false',
  }

  // Validate
  const errors = validateProduct(values)
  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  // Build slug from name (diacritic-safe)
  const slug = toSlug(values.name)
  if (!slug) {
    return { errors: { name: 'Le nom ne peut pas être converti en identifiant URL.' } }
  }

  // supabase client already created above for auth — reuse it.

  // Supabase Database types are stub placeholders until `supabase gen types` runs.
  // Cast the insert payload and result to avoid the 'never[]' stub inference.
  const insertPayload = {
    name: values.name.trim(),
    slug,
    category_id: values.category_id,
    sku: values.sku,
    unit: values.unit.trim(),
    description: values.description,
    is_active: values.is_active,
  }

  const { data, error } = (await supabase
    .from('products')
    .insert(insertPayload as never)
    .select('id')
    .single()) as unknown as {
    data: { id: string } | null
    error: { code: string; message: string } | null
  }

  if (error) {
    // 42501 — table-level permission denied. Happens when:
    // a) dev preview (anon role, no INSERT grant) or
    // b) authenticated user without platform_admin role.
    if (error.code === '42501') {
      return {
        message:
          'Accès refusé. Connectez-vous avec un compte platform_admin pour créer des produits.',
      }
    }
    // Unique constraint violation — slug or SKU conflict
    if (error.code === '23505') {
      if (error.message.includes('sku')) {
        return { errors: { sku: 'Ce SKU est déjà utilisé par un autre produit.' } }
      }
      return {
        message:
          'Un produit avec ce nom (ou cet identifiant) existe déjà. Choisissez un nom différent.',
      }
    }
    return { message: `Erreur lors de la création: ${error.message}` }
  }

  if (!data) {
    return { message: 'Le produit a été créé mais son identifiant est introuvable.' }
  }

  redirect(`/products/${data.id}`)
}
