'use client'
import { useState, useTransition, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

interface UsuarioRow {
  id: number
  nombre: string
  datos: string | null
  acceso: string | null
  id_personal: string | null
}

function LoginForm() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const sb = getSupabaseClient()

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const { data, error: dbErr } = await sb
        .from('usuarios')
        .select('id, nombre, datos, acceso, id_personal')
        .eq('nombre', nombre.trim())
        .eq('contrasena', password)
        .eq('activo', true)
        .maybeSingle()

      if (dbErr) { setError(dbErr.message); return }
      if (!data) { setError('Usuario o contrasena incorrectos'); return }

      const usuario = data as UsuarioRow

      sessionStorage.setItem('cis_usuario', JSON.stringify({
        id: usuario.id,
        nombre: usuario.nombre,
        datos: usuario.datos,
        acceso: usuario.acceso,
        id_personal: usuario.id_personal,
      }))

      document.cookie = 'cis_session=1; path=/; SameSite=Lax'

      router.push('/select-project')
    })
  }

  return (
    <main className="min-h-screen flex items-stretch font-sans">
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-3 bg-blue-900 z-10" />
        <div className="absolute left-5 top-0 bottom-0 w-1.5 bg-blue-700/60 z-10" />
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-500/40 z-10" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/warehouse-bg.png" alt="Almacen Unidad Minera Jabali" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-10 left-12 z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-wide">CIS Nicaragua</span>
          </div>
          <h2 className="text-white text-3xl font-extrabold leading-tight drop-shadow-lg">
            Sistema de Gestion<br />de Almacen
          </h2>
          <p className="text-blue-200 text-sm mt-2 drop-shadow">Unidad Minera Jabali - Nicaragua</p>
          <div className="flex items-center gap-2 mt-4 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Conectado a Supabase</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-slate-950 px-8 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3 shadow-lg shadow-blue-600/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">CIS Nicaragua</h1>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Iniciar sesion</h1>
            <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label htmlFor="nombre" className="block text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Tu nombre de usuario"
                  disabled={isPending}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-widest mb-2">
                Contrasena
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="..."
                  disabled={isPending}
                  className="w-full bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !nombre || !password}
              className="relative w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 disabled:shadow-none overflow-hidden group"
            >
              <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                {isPending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    Ingresar
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-8">
            2025 CIS Nicaragua - Unidad Minera Jabali - v2.0
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  )
}
