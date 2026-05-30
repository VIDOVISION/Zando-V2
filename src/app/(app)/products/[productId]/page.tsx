import { notFound } from 'next/navigation'
import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { getProductById } from '@/src/lib/products/queries'
import { getCurrentShopId, getInventoryForProduct } from '@/src/lib/inventory/queries'
import { ProductDetailHeader } from '@/src/components/products/product-detail-header'
import { ProductDetailInfo } from '@/src/components/products/product-detail-info'
import { ProductDetailInventoryCard } from '@/src/components/products/product-detail-inventory-card'
import type { Profile } from '@/src/lib/auth/get-current-profile'

type Params = Promise<{ productId: string }>

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { productId } = await params

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

  const product = await getProductById(productId)
  if (!product) notFound()

  // Fetch inventory snapshot for shop-scoped roles
  const shopRoles = new Set(['shop_owner', 'shop_staff'])
  const shopId = shopRoles.has(profile.role)
    ? await getCurrentShopId(profile.id, profile.role)
    : null

  const inventory = shopId
    ? await getInventoryForProduct(productId, shopId)
    : null

  return (
    <div className="space-y-6 p-4">
      <ProductDetailHeader product={product} />
      <ProductDetailInfo product={product} />
      {inventory && (
        <ProductDetailInventoryCard inventory={inventory} unit={product.unit} />
      )}
    </div>
  )
}
