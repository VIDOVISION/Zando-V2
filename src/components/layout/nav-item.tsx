'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItemProps = {
  href: string
  label: string
  icon: React.ReactNode
}

export function NavItem({ href, label, icon }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[#f0fdfa] text-[#0d9488]'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
