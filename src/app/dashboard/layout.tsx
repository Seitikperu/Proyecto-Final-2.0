'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ToastContainer } from '@/components/ui/Toast'
import { Proyecto } from '@/lib/context/ProyectoContext'
import { getSupabaseClient } from '@/lib/supabase/client'

interface CisUser {
  id: number
  nombre: string
  datos: string | null
  acceso: string | null
  id_personal: string | null
}

const NAV = [
  { group: 'Almacén', module: 'almacen', items: [
    { label: 'Ingresos',   href: '/dashboard/almacen/ingresos' },
    { label: 'Salidas',    href: '/dashboard/almacen/salidas' },
    { label: 'Stock',      href: '/dashboard/almacen/stock' },
    { label: 'Inventario', href: '/dashboard/almacen/inventario' },
  ]},
  { group: 'Producción', module: 'produccion', items: [
    { label: 'Control Diario', href: '/dashboard/produccion' },
    { label: 'Plan Mensual',   href: '/dashboard/produccion/plan-mes' },
    { label: 'Explosivos',     href: '/dashboard/produccion/explosivos' },
    { label: 'Vibraciones',    href: '/dashboard/produccion/vibraciones' },
  ]},
  { group: 'Maestros', module: 'maestros', items: [
    { label: 'Proveedores', href: '/dashboard/maestros/proveedores' },
    { label: 'CeCos',       href: '/dashboard/maestros/cecos' },
    { label: 'Personal',    href: '/dashboard/maestros/personal' },
    { label: 'Equipos',     href: '/dashboard/maestros/equipos' },
    { label: 'Materiales',  href: '/dashboard/maestros/materiales' },
    { label: 'Labores',     href: '/dashboard/maestros/labores' },
  ]},
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [user,    setUser]    = useState<CisUser | null>(null)
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [open,    setOpen]    = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cis_usuario')
      if (!raw) {
        router.replace('/login?redirectTo=' + encodeURIComponent(pathname))
        return
      }
      setUser(JSON.parse(raw) as CisUser)

      // Leer proyecto seleccionado
      const rawP = localStorage.getItem('cis_proyecto')
      if (rawP) setProyecto(JSON.parse(rawP) as Proyecto)
      else router.replace('/select-project')  // sin proyecto -> volver a seleccionar
    } catch {
      router.replace('/login')
    } finally {
      setChecked(true)
    }
  }, [pathname, router])

  async function logout() {
    await getSupabaseClient().auth.signOut()
    localStorage.removeItem('cis_usuario')
    localStorage.removeItem('cis_proyecto')
    document.cookie = 'cis_session=; path=/; max-age=0'
    router.push('/login')
  }

  // Pantalla de carga mientras verifica sesión
  if (!checked) return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center">
      <div className="flex items-center gap-3 text-brand-gray">
        <svg className="w-5 h-5 animate-spin text-brand-red" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-sm">Verificando sesión...</span>
      </div>
    </div>
  )

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-60">
      {/* Logo + Proyecto activo */}
      <div className="px-4 py-5 border-b border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div>
            <p className="text-brand-black font-semibold text-sm leading-tight">CIS Nicaragua</p>
            <p className="text-brand-gray text-xs">Unidad Minera Jabalí</p>
          </div>
        </div>
        {/* Badge de proyecto activo y selector de modulo */}
        {proyecto && (
          <div className="flex flex-col gap-2">
            <div className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 border bg-brand-light border-slate-200`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{proyecto.icono}</span>
                <div>
                  <p className={`text-xs font-semibold leading-tight text-brand-black`}>{proyecto.nombre}</p>
                  <p className="text-brand-gray text-xs">{proyecto.id}</p>
                </div>
              </div>
              <Link href="/select-project" className="text-brand-gray hover:text-brand-red transition-colors" title="Cambiar proyecto">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                </svg>
              </Link>
            </div>
            <Link 
              href="/select-module" 
              className="flex items-center justify-center gap-2 w-full py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-brand-red/30 text-xs font-medium text-brand-gray hover:text-brand-black transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
              Volver a Módulos
            </Link>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.filter(({ module }) => {
          if (pathname.startsWith('/dashboard/almacen') || pathname === '/dashboard') return module === 'almacen'
          if (pathname.startsWith('/dashboard/produccion')) return module === 'produccion'
          if (pathname.startsWith('/dashboard/maestros')) return module === 'maestros'
          return true
        }).map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs font-bold text-brand-gray uppercase tracking-wider px-2 mb-1.5">{group}</p>
            <ul className="space-y-0.5">
              {items.map(({ label, href }) => {
                const active = pathname.startsWith(href)
                return (
                  <li key={href}>
                    <Link href={href} onClick={() => setOpen(false)}
                      className={`flex items-center px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active ? 'bg-brand-red/10 text-brand-red font-semibold border-l-2 border-brand-red' : 'text-brand-gray hover:text-brand-black hover:bg-slate-50'
                      }`}>
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usuario + logout */}
      <div className="px-3 pb-4 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-7 h-7 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-red text-xs font-bold">
              {user?.nombre?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-brand-black text-xs font-semibold truncate">{user?.nombre ?? 'Usuario'}</p>
            {user?.acceso && <p className="text-brand-gray text-xs truncate">{user.acceso}</p>}
          </div>
          <button onClick={logout} className="text-brand-gray hover:text-brand-red transition-colors p-1" title="Cerrar sesión">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-brand-light">
      {/* Sidebar desktop */}
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>

      {/* Sidebar mobile */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)}/>
          <div className="relative w-72 flex-shrink-0"><Sidebar /></div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button onClick={() => setOpen(true)} className="text-brand-gray hover:text-brand-black">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span className="text-brand-black font-semibold text-sm">CIS Nicaragua</span>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Toast global siempre presente */}
      <ToastContainer />
    </div>
  )
}
