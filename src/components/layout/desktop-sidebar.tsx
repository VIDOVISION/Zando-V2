import type { Profile } from '@/src/lib/auth/get-current-profile'
import { NavItem } from './nav-item'

const LABELS = {
  brand: 'Zando',
  dashboard: 'Accueil',
  products: 'Produits',
  inventory: 'Stock',
  orders: 'Commandes',
  more: 'Plus',
} as const

function HouseIcon() {
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
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BoxIcon() {
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
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function LayersIcon() {
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
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

function FileTextIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function MenuIcon() {
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
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

const navItems = [
  { label: LABELS.dashboard, href: '/dashboard', icon: <HouseIcon /> },
  { label: LABELS.products, href: '/products', icon: <BoxIcon /> },
  { label: LABELS.inventory, href: '/inventory', icon: <LayersIcon /> },
  { label: LABELS.orders, href: '/orders', icon: <FileTextIcon /> },
  { label: LABELS.more, href: '/more', icon: <MenuIcon /> },
] as const

type Props = {
  profile: Profile
}

// profile is accepted so the caller can pass it without prop-drilling changes later.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function DesktopSidebar({ profile: _profile }: Props) {
  return (
    <aside
      className="hidden h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white md:flex"
      aria-label="Navigation latérale"
    >
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 px-4">
        {/* Logo mark */}
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0d9488]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
        </div>
        <span className="text-lg font-bold text-[#0d9488]">{LABELS.brand}</span>
      </div>

      {/* Nav list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu principal">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavItem href={item.href} label={item.label} icon={item.icon} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
