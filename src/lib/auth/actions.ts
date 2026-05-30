'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase/server'

export type SignInState = {
  message?: string
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = ((formData.get('email') as string | null) ?? '').trim()
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { message: 'Veuillez renseigner votre e-mail et mot de passe.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Translate common Supabase Auth error codes/messages to French
    const msg = error.message ?? ''
    const code = (error as { code?: string }).code ?? ''

    if (
      code === 'invalid_credentials' ||
      msg.includes('Invalid login credentials')
    ) {
      return { message: 'E-mail ou mot de passe incorrect.' }
    }
    if (
      code === 'email_not_confirmed' ||
      msg.includes('Email not confirmed')
    ) {
      return { message: 'Confirmez votre e-mail avant de vous connecter.' }
    }
    if (
      code === 'over_request_rate_limit' ||
      msg.includes('Too many requests')
    ) {
      return { message: 'Trop de tentatives. Réessayez dans quelques minutes.' }
    }

    return { message: 'Erreur de connexion. Réessayez.' }
  }

  redirect('/dashboard')
}
