'use server'

import { createClient } from '@/lib/supabase/server'

export async function loginAction(email: string, password: string) {
  try {
    const supabase = await createClient()
    
    // Al autenticar desde el servidor, Supabase automáticamente
    // envía las cabeceras HTTP "Set-Cookie" al navegador.
    // Esto es 100% infalible y evita problemas con document.cookie.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }

    return { success: true, userId: data.user?.id }
  } catch (err: any) {
    return { error: err.message || 'Error inesperado' }
  }
}
