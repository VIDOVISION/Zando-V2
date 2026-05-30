import type { Product } from '@/src/lib/products/types'
import { ProductCard } from './product-card'

type Props = {
  products: Product[]
}

export function ProductList({ products }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
