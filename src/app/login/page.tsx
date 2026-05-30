import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0d9488]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
          <span className="text-2xl font-bold text-[#0d9488]">Zando</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-8 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-gray-900">
            Connectez-vous
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Entrez vos identifiants pour continuer.
          </p>

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.com"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20"
              />
            </div>

            <button
              type="submit"
              className="mt-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e] active:bg-[#115e59]"
            >
              Continuer
            </button>
          </form>
        </div>

        {/* Dev preview link */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600"
          >
            Aperçu développeur → Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
