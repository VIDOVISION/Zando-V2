import type { StockMovement } from '@/src/lib/inventory/types'
import type { MovementType } from '@/src/lib/supabase/types'

// Direction helpers — quantity is always positive; direction lives in movement_type
const MOVEMENT_IN: MovementType[] = ['purchase_in', 'adjustment_in', 'transfer_in']

function movementLabel(type: MovementType): string {
  const labels: Record<MovementType, string> = {
    purchase_in: 'Achat',
    sale_out: 'Vente',
    adjustment_in: 'Ajustement +',
    adjustment_out: 'Ajustement −',
    damage: 'Perte / dommage',
    transfer_in: 'Transfert entrant',
    transfer_out: 'Transfert sortant',
  }
  return labels[type] ?? type
}

function MovementBadge({ type }: { type: MovementType }) {
  const isIn = MOVEMENT_IN.includes(type)
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
        isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {isIn ? '+' : '−'} {movementLabel(type)}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  movements: StockMovement[]
}

export function StockMovementList({ movements }: Props) {
  if (movements.length === 0) {
    return (
      <p className="text-sm text-gray-400">Aucun mouvement enregistré.</p>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {movements.map((m) => {
        const isIn = MOVEMENT_IN.includes(m.movement_type)
        return (
          <li key={m.id} className="flex items-start gap-3 px-4 py-3">
            {/* Direction indicator */}
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
              aria-hidden="true"
            >
              {isIn ? '↑' : '↓'}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-gray-900">
                  {m.product_name}
                </span>
                <MovementBadge type={m.movement_type} />
              </div>

              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                <span>
                  Qté:{' '}
                  <span className="font-medium text-gray-700">
                    {m.quantity % 1 === 0 ? m.quantity.toFixed(0) : m.quantity.toFixed(3)}
                  </span>
                </span>
                {m.reference_type && (
                  <span>Réf: {m.reference_type}</span>
                )}
                <span>Par: {m.created_by_name}</span>
                <span>{formatDate(m.created_at)}</span>
              </div>

              {m.note && (
                <p className="mt-0.5 text-xs text-gray-500 italic">{m.note}</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
