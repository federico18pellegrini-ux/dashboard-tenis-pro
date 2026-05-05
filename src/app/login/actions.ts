'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Inicia sesión con email y contraseña
 */
export async function login(formData: FormData) {
  const supabase = await createSupabaseServerClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    // Redirige con un mensaje de error específico si la autenticación falla
    redirect('/login?error=Credenciales inválidas')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

/**
 * Envía un correo de recuperación de contraseña
 */
export async function resetPasswordAction(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  const email = formData.get('email') as string

  if (!email) {
    redirect('/login?error=Ingresa tu email para recuperar la contraseña')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Esta URL debe estar configurada en el Dashboard de Supabase -> Auth -> URL Configuration
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dashboard-tenis-pro-fpr7.vercel.app'}/auth/callback?next=/dashboard/update-password`,
  })

  if (error) {
    redirect(`/login?error=Error: ${error.message}`)
  }

  // Redirige con un mensaje de éxito para informar al usuario
  redirect('/login?message=Se ha enviado un enlace de recuperación a tu email')
}