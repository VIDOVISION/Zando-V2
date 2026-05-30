import type { Product } from '@/src/lib/products/types'

type Props = {
  product: Product
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}

export function ProductDetailInfo({ product }: Props) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Informations produit
      </h2>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100 px-4">
        <InfoRow label="Catégorie" value={product.category?.name ?? '—'} />
        <InfoRow label="Unité" value={product.unit} />
        {product.sku && (
          <InfoRow
            label="SKU"
            value={
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700">
                {product.sku}
              </span>
            }
          />
        )}
        {product.slug && (
          <InfoRow
            label="Identifiant"
            value={
              <span className="font-mono text-xs text-gray-500">{product.slug}</span>
            }
          />
        )}
      </div>

      {product.description && (
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Description
          </p>
          <p className="text-sm text-gray-700">{product.description}</p>
        </div>
      )}
    </section>
  )
}
