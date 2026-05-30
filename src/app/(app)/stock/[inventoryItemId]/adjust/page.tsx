import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isDevPreview } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { getInventoryItemById } from '@/src/lib/inventory/queries'
import { StockAdjustmentForm } from '@/src/components/stock/stock-adjustment-form'

type Params = Promise<{ inventoryItemId: string }>

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

export default async function AdjustStockPage({ params }: { params: Params }) {
  const { inventoryItemId } = await params

  if (!isDevPreview()) {
    await requireRole('platform_admin')
  }

  const item = await getInventoryItemById(inventoryItemId)
  if (!item) notFound()

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link
          href="/stock"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ChevronLeftIcon />
          Stock
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ajustement de stock</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {item.product_name}
          {item.category_name ? ` · ${item.category_name}` : ''}
        </p>
      </div>

      <StockAdjustmentForm item={item} />
    </div>
  )
}
