import Link from 'next/link'
import type { Product } from '@/src/lib/products/types'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Icon placeholder (replaces image until image_url is served) */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0fdfa]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0d9488"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-gray-900">
            {product.name}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              product.is_active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {product.is_active ? 'Actif' : 'Inactif'}
          </span>
        </div>

        {/* Category */}
        <p className="mt-0.5 truncate text-xs text-gray-400">
          {product.category?.name ?? 'Sans catégorie'}
        </p>

        {/* Badges: unit + SKU */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {product.unit}
          </span>
          {product.sku && (
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
              SKU: {product.sku}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
