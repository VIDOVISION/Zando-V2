// Placeholder — replace with the output of:
//   npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
//
// Until generated types are available all Supabase client calls will use `unknown`
// for table/column types. Type safety is added in a later step once the project is
// connected to a live Supabase instance.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Re-exported from the schema enums in 0001_zando_v2_core_schema.sql
export type UserRole =
  | 'platform_admin'
  | 'shop_owner'
  | 'shop_staff'
  | 'supplier'
  | 'delivery_operator'

export type MovementType =
  | 'purchase_in'
  | 'sale_out'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'damage'
  | 'transfer_in'
  | 'transfer_out'

export type OrderStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'failed'

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank_transfer'

export type PaymentStatus = 'pending' | 'completed' | 'failed'

export type CurrencyCode = 'CDF' | 'USD'

// Stub — will be replaced by `supabase gen types` output.
export type Database = {
  public: {
    Tables: Record<string, unknown>
    Views: Record<string, unknown>
    Functions: Record<string, unknown>
    Enums: {
      user_role: UserRole
      movement_type: MovementType
      order_status: OrderStatus
      delivery_status: DeliveryStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      currency_code: CurrencyCode
    }
  }
}
