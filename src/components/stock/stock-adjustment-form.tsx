'use client'

import { useActionState } from 'react'
import { adjustStock } from '@/src/lib/inventory/actions'
import type { StockItem } from '@/src/lib/inventory/types'

// Movement type options with French labels.
// Only values valid in the movement_type enum are included.
// Inbound types increase stock; outbound types reduce it.
const MOVEMENT_OPTIONS = [
  { value: 'purchase_in',   label: 'Réception / Achat',        direction: 'in' },
  { value: 'sale_out',      label: 'Vente',                    direction: 'out' },
  { value: 'adjustment_in', label: 'Ajustement + (entrée)',    direction: 'in' },
  { value: 'adjustment_out',label: 'Ajustement − (sortie)',    direction: 'out' },
  { value: 'damage',        label: 'Perte / Dommage',          direction: 'out' },
  { value: 'transfer_out',  label: 'Transfert sortant',        direction: 'out' },
] as const

type Props = {
  item: StockItem
}

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 w-full'

export function StockAdjustmentForm({ item }: Props) {
  const [state, action, pending] = useActionState(adjustStock, {})

  return (
    <form action={action} className="space-y-5">
      {/* Hidden: binds this form to the specific inventory item */}
      <input type="hidden" name="inventory_item_id" value={item.id} />

      {state.message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* Current stock info */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">{item.product_name}</p>
        {item.sku && <p className="text-xs text-blue-600">SKU: {item.sku}</p>}
        <p className="mt-1 text-xs text-gray-500">
          Stock actuel:{' '}
          <span className="font-semibold text-gray-800">
            {item.quantity_on_hand % 1 === 0
              ? item.quantity_on_hand.toFixed(0)
              : item.quantity_on_hand.toFixed(3)}{' '}
            {item.unit}
          </span>
        </p>
      </div>

      {/* Movement type */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="movement_type" className="text-sm font-medium text-gray-700">
          Type de mouvement <span className="text-red-500">*</span>
        </label>
        <select
          id="movement_type"
          name="movement_type"
          defaultValue=""
          required
          className={inputClass}
        >
          <option value="" disabled>
            Sélectionner…
          </option>
          <optgroup label="Entrées (augmentent le stock)">
            {MOVEMENT_OPTIONS.filter((o) => o.direction === 'in').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Sorties (réduisent le stock)">
            {MOVEMENT_OPTIONS.filter((o) => o.direction === 'out').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        </select>
        {state.errors?.movement_type && (
          <p className="text-xs text-red-600">{state.errors.movement_type}</p>
        )}
      </div>

      {/* Quantity */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
          Quantité <span className="text-red-500">*</span>
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min="0.001"
          step="any"
          required
          placeholder={`en ${item.unit}`}
          className={inputClass}
        />
        {state.errors?.quantity && (
          <p className="text-xs text-red-600">{state.errors.quantity}</p>
        )}
      </div>

      {/* Note */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="note" className="text-sm font-medium text-gray-700">
          Note / Raison (optionnel)
        </label>
        <input
          id="note"
          name="note"
          type="text"
          placeholder="ex. Inventaire mensuel, retour fournisseur…"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e] disabled:opacity-60"
      >
        {pending ? 'Enregistrement…' : 'Enregistrer le mouvement'}
      </button>
    </form>
  )
}
