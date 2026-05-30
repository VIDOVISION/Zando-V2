'use client'

import { useActionState } from 'react'
import { signIn } from '@/src/lib/auth/actions'

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/20 w-full'

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {})

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.message && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exemple.com"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gray-700">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e] active:bg-[#115e59] disabled:opacity-60"
      >
        {pending ? 'Connexion…' : 'Continuer'}
      </button>
    </form>
  )
}
