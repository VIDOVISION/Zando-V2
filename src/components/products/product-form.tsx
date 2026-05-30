'use client'

import { useActionState } from 'react'
import { createProduct } from '@/src/lib/products/actions'
import type { ProductCategory } from '@/src/lib/products/types'

const UNIT_OPTIONS = [
  'bouteille',
  'pièce',
  'kg',
  'litre',
  'carton',
  'sac',
] as const

type Props = {
  categories: ProductCategory[]
}

type FieldProps = {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function Field({ label, htmlFor, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 w-full'

export function ProductForm({ categories }: Props) {
  const [state, action, pending] = useActionState(createProduct, {})

  return (
    <form action={action} className="space-y-5">
      {/* Global error */}
      {state.message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Name */}
      <Field
        label="Nom du produit"
        htmlFor="name"
        error={state.errors?.name}
        required
      >
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="off"
          placeholder="ex. Fanta Orange 50cl"
          className={inputClass}
        />
      </Field>

      {/* Category */}
      <Field
        label="Catégorie"
        htmlFor="category_id"
        error={state.errors?.category_id}
        required
      >
        <select
          id="category_id"
          name="category_id"
          defaultValue=""
          required
          className={inputClass}
        >
          <option value="" disabled>
            Sélectionner une catégorie…
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </Field>

      {/* SKU */}
      <Field label="SKU" htmlFor="sku" error={state.errors?.sku} required>
        <input
          id="sku"
          name="sku"
          type="text"
          required
          autoComplete="off"
          placeholder="ex. FAO50"
          className={inputClass}
        />
      </Field>

      {/* Unit */}
      <Field
        label="Unité"
        htmlFor="unit"
        error={state.errors?.unit}
        required
      >
        <select id="unit" name="unit" defaultValue="bouteille" className={inputClass}>
          {UNIT_OPTIONS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Field>

      {/* Description */}
      <Field label="Description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Description courte (optionnel)"
          className={`${inputClass} resize-none`}
        />
      </Field>

      {/* Status */}
      <Field label="Statut" htmlFor="is_active">
        <select id="is_active" name="is_active" defaultValue="true" className={inputClass}>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
      </Field>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e] disabled:opacity-60"
      >
        {pending ? 'Création en cours…' : 'Créer le produit'}
      </button>
    </form>
  )
}
