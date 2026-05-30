type Props = {
  title: string
  children: React.ReactNode
}

export function MoreSection({ title, children }: Props) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
        {children}
      </div>
    </section>
  )
}
