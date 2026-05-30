type Props = {
  message?: string
  detail?: string
}

export function StockEmptyState({
  message = 'Aucun article en stock',
  detail = "L'inventaire de votre boutique s'affichera ici une fois les produits ajoutés.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-6 py-14 text-center">
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
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <p className="mt-1 max-w-xs text-xs text-gray-400">{detail}</p>
    </div>
  )
}
