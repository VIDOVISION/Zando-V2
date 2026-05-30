import Link from 'next/link'
import { isDevPreview } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { getProductCategories } from '@/src/lib/products/queries'
import { ProductForm } from '@/src/components/products/product-form'

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

export default async function NewProductPage() {
  // Only platform_admin may access this page; dev preview bypasses the check
  if (!isDevPreview()) {
    await requireRole('platform_admin')
  }

  const categories = await getProductCategories()

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeftIcon />
          Produits
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nouveau produit</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          Ajoutez un produit au catalogue global.
        </p>
      </div>

      <ProductForm categories={categories} />
    </div>
  )
}
