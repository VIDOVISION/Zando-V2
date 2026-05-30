type Props = {
  filtered?: boolean
}

export function OrderEmptyState({ filtered = false }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">
        {filtered ? 'Aucune commande dans cette catégorie' : 'Aucune commande'}
      </p>
      <p className="mt-1 max-w-xs text-xs text-gray-400">
        {filtered
          ? 'Essayez un autre filtre ou revenez à Toutes les commandes.'
          : 'Les commandes passées auprès de vos fournisseurs apparaîtront ici.'}
      </p>
    </div>
  )
}
