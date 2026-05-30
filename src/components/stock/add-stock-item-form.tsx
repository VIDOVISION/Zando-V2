'use client'

import { useActionState } from 'react'
import { addProductToInventory } from '@/src/lib/inventory/actions'
import type { Product } from '@/src/lib/products/types'
import type { ShopOption } from '@/src/lib/inventory/queries'

type Props = {
  products: Product[]
  shops: ShopOption[]
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

export function AddStockItemForm({ products, shops }: Props) {
  const [state, action, pending] = useActionState(addProductToInventory, {})

  return (
    <form action={action} className="space-y-5">
      {state.message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Product */}
      <Field
        label="Produit"
        htmlFor="product_id"
        error={state.errors?.product_id}
        required
      >
        <select
          id="product_id"
          name="product_id"
          defaultValue=""
          required
          className={inputClass}
        >
          <option value="" disabled>
            Sélectionner un produit…
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.sku ? ` — ${p.sku}` : ''}
            </option>
          ))}
        </select>
      </Field>

      {/* Shop */}
      <Field
        label="Boutique"
        htmlFor="shop_id"
        error={state.errors?.shop_id}
        required
      >
        <select
          id="shop_id"
          name="shop_id"
          defaultValue=""
          required
          className={inputClass}
        >
          <option value="" disabled>
            Sélectionner une boutique…
          </option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.city ? ` (${s.city})` : ''}
            </option>
          ))}
        </select>
      </Field>

      {/* Opening quantity */}
      <Field
        label="Quantité d'ouverture"
        htmlFor="opening_quantity"
        error={state.errors?.opening_quantity}
      >
        <input
          id="opening_quantity"
          name="opening_quantity"
          type="number"
          min="0"
          step="1"
          defaultValue="0"
          className={inputClass}
        />
      </Field>

      {/* Min quantity */}
      <Field
        label="Quantité minimale (seuil de réappro.)"
        htmlFor="min_quantity"
        error={state.errors?.min_quantity}
      >
        <input
          id="min_quantity"
          name="min_quantity"
          type="number"
          min="0"
          step="1"
          defaultValue="0"
          className={inputClass}
        />
      </Field>

      {/* Selling price */}
      <Field
        label="Prix de vente (optionnel)"
        htmlFor="selling_price"
        error={state.errors?.selling_price}
      >
        <input
          id="selling_price"
          name="selling_price"
          type="number"
          min="0"
          step="any"
          placeholder="ex. 2200"
          className={inputClass}
        />
      </Field>

      {/* Currency */}
      <Field label="Devise" htmlFor="currency">
        <select id="currency" name="currency" defaultValue="CDF" className={inputClass}>
          <option value="CDF">CDF — Franc congolais</option>
          <option value="USD">USD — Dollar américain</option>
        </select>
      </Field>

      {/* Note */}
      <Field label="Note (optionnel)" htmlFor="note">
        <input
          id="note"
          name="note"
          type="text"
          defaultValue="Stock d'ouverture"
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e] disabled:opacity-60"
      >
        {pending ? 'Ajout en cours…' : 'Ajouter au stock'}
      </button>
    </form>
  )
}
