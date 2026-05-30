import Link from 'next/link'
import { isDevPreview } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { getProducts, getProductCategories } from '@/src/lib/products/queries'
import { ProductList } from '@/src/components/products/product-list'
import { ProductEmptyState } from '@/src/components/products/product-empty-state'
import type { Profile } from '@/src/lib/auth/get-current-profile'
import { DEV_PROFILE } from '@/src/lib/dev'

type SearchParams = Promise<{ search?: string; category?: string }>

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  let profile: Profile

  if (isDevPreview()) {
    profile = DEV_PROFILE
  } else {
    profile = await requireRole(
      'platform_admin',
      'shop_owner',
      'shop_staff',
      'supplier',
      'delivery_operator',
    )
  }

  const { search, category } = await searchParams

  const [products, categories] = await Promise.all([
    getProducts({ search, categoryId: category }),
    getProductCategories(),
  ])

  const isAdmin = profile.role === 'platform_admin'

  return (
    <div className="p-4">
      {/* Page header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Produits</h1>
          {products.length > 0 && (
            <p className="mt-0.5 text-sm text-gray-400">
              {products.length} produit{products.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {(isAdmin || isDevPreview()) && (
          <Link
            href="/products/new"
            className="rounded-lg bg-[#0d9488] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0f766e]"
          >
            + Nouveau
          </Link>
        )}
      </div>

      {/* Search + filter bar */}
      <form method="GET" className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            name="search"
            defaultValue={search ?? ''}
            placeholder="Rechercher un produit…"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
          />
        </div>

        {/* Category filter — wired to URL params, filters not implemented yet */}
        <select
          name="category"
          defaultValue={category ?? ''}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
          disabled={categories.length === 0}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        {/* Hidden submit so pressing Enter in the search input works */}
        <button type="submit" className="sr-only">
          Rechercher
        </button>
      </form>

      {/* Product list or empty state */}
      {products.length === 0 ? (
        <ProductEmptyState />
      ) : (
        <ProductList products={products} />
      )}
    </div>
  )
}
