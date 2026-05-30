import { isDevPreview, DEV_PROFILE } from '@/src/lib/dev'
import { requireRole } from '@/src/lib/auth/require-role'
import { MoreSection } from '@/src/components/more/more-section'
import { MoreMenuItem } from '@/src/components/more/more-menu-item'
import type { Profile } from '@/src/lib/auth/get-current-profile'

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function ShopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function MorePage() {
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

  return (
    <div className="space-y-5 p-4">
      {/* Page header + user summary */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Plus</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {profile.full_name} · {profile.role}
        </p>
      </div>

      {/* 1. Boutique */}
      <MoreSection title="Boutique">
        <MoreMenuItem
          icon={<ShopIcon />}
          title="Profil boutique"
          description="Nom, adresse et informations"
          href="/settings/shop"
          disabled
        />
        <MoreMenuItem
          icon={<UsersIcon />}
          title="Gestion du personnel"
          description="Inviter et gérer les employés"
          href="/settings/staff"
          disabled
        />
      </MoreSection>

      {/* 2. Fournisseurs */}
      <MoreSection title="Fournisseurs">
        <MoreMenuItem
          icon={<BuildingIcon />}
          title="Annuaire fournisseurs"
          description="Voir et gérer vos fournisseurs"
          href="/suppliers"
          disabled
        />
      </MoreSection>

      {/* 3. Livraisons */}
      <MoreSection title="Livraisons">
        <MoreMenuItem
          icon={<TruckIcon />}
          title="Mes livraisons"
          description="Suivre les livraisons en cours"
          href="/deliveries"
          disabled
        />
      </MoreSection>

      {/* 4. Finance */}
      <MoreSection title="Finance">
        <MoreMenuItem
          icon={<CreditCardIcon />}
          title="Paiements"
          description="Historique des paiements"
          href="/payments"
          disabled
        />
        <MoreMenuItem
          icon={<BarChartIcon />}
          title="Rapport financier"
          description="Aperçu des revenus et dépenses"
          href="/finance"
          disabled
        />
      </MoreSection>

      {/* 5. Paramètres */}
      <MoreSection title="Paramètres">
        <MoreMenuItem
          icon={<UserIcon />}
          title="Mon compte"
          description="Profil et sécurité"
          href="/settings/account"
          disabled
        />
        <MoreMenuItem
          icon={<SettingsIcon />}
          title="Paramètres"
          description="Préférences de l'application"
          href="/settings"
          disabled
        />
      </MoreSection>

      {/* 6. Déconnexion */}
      <MoreSection title="Déconnexion">
        {/* Placeholder — will become a Server Action calling supabase.auth.signOut() */}
        <MoreMenuItem
          icon={<LogOutIcon />}
          title="Se déconnecter"
          description="Fermer votre session"
          href="/login"
          variant="danger"
        />
      </MoreSection>
    </div>
  )
}
