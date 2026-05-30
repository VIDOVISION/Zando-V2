import Link from 'next/link'

type Props = {
  icon: React.ReactNode
  title: string
  description?: string
  href: string
  disabled?: boolean
  variant?: 'default' | 'danger'
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function MoreMenuItem({
  icon,
  title,
  description,
  href,
  disabled = false,
  variant = 'default',
}: Props) {
  const isDanger = variant === 'danger'

  const inner = (
    <>
      {/* Icon */}
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          disabled
            ? 'bg-gray-100 text-gray-300'
            : isDanger
              ? 'bg-red-50 text-red-500'
              : 'bg-[#f0fdfa] text-[#0d9488]'
        }`}
      >
        {icon}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            disabled ? 'text-gray-300' : isDanger ? 'text-red-500' : 'text-gray-800'
          }`}
        >
          {title}
        </p>
        {description && (
          <p className={`mt-0.5 text-xs ${disabled ? 'text-gray-300' : 'text-gray-400'}`}>
            {description}
          </p>
        )}
      </div>

      {/* Right slot */}
      {disabled ? (
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
          Bientôt
        </span>
      ) : (
        <span className={`shrink-0 ${isDanger ? 'text-red-400' : 'text-gray-300'}`}>
          <ChevronRight />
        </span>
      )}
    </>
  )

  if (disabled) {
    return (
      <div
        className="flex cursor-not-allowed items-center gap-3 px-4 py-3"
        aria-disabled="true"
      >
        {inner}
      </div>
    )
  }

  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100">
      {inner}
    </Link>
  )
}
