import Link from 'next/link'
import { isDevPreview } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { getProducts } from '@/src/lib/products/queries'
import { getShops } from '@/src/lib/inventory/queries'
import { AddStockItemForm } from '@/src/components/stock/add-stock-item-form'

function ChevronLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export default async function AddStockItemPage() {
  if (!isDevPreview()) {
    await requireRole('platform_admin')
  }

  const [allProducts, shops] = await Promise.all([
    getProducts(),
    getShops(),
  ])

  // Only show active products in the add-to-inventory form
  const products = allProducts.filter((p) => p.is_active)

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/stock"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeftIcon />
          Stock
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ajouter au stock</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Ajoutez un produit à l&apos;inventaire d&apos;une boutique.
        </p>
      </div>

      <AddStockItemForm products={products} shops={shops} />
    </div>
  )
}
