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
    { label: 'Topografía',     href: '/dashboard/produccion/topografia' },
    { label: 'Plan Mensual',   href: '/dashboard/produccion/plan-mes' },
    { label: 'Explosivos',     href: '/dashboard/produccion/explosivos' },
    { label: 'Vibraciones',    href: '/dashboard/produccion/vibraciones' },
  ]},
  { group: 'Maestros', module: 'maestros', items: [
    { label: 'Proveedores',   href: '/dashboard/maestros/proveedores' },
    { label: 'CeCos',         href: '/dashboard/maestros/cecos' },
    { label: 'Personal',      href: '/dashboard/maestros/personal' },
    { label: 'Equipos',       href: '/dashboard/maestros/equipos' },
    { label: 'Materiales',    href: '/dashboard/maestros/materiales' },
    { label: 'Labores',       href: '/dashboard/maestros/labores' },
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

  const Sidebar = () => {
    let moduleName = 'DIGITAL'
    if (pathname.startsWith('/dashboard/almacen') || pathname === '/dashboard') moduleName = 'ALMACÉN'
    else if (pathname.startsWith('/dashboard/produccion')) moduleName = 'PRODUCCIÓN'
    else if (pathname.startsWith('/dashboard/maestros') || pathname.startsWith('/dashboard/personal')) moduleName = 'MAESTROS'

    return (
      <div className="flex flex-col h-full bg-[#111111] text-white w-64 shadow-xl">
        {/* Cabecera del Sidebar */}
        <div className="px-6 py-6 border-b border-white/5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c83232] flex items-center justify-center shadow-lg shadow-[#c83232]/20 flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Módulo Actual</span>
              <span className="text-white font-black text-xl tracking-tight leading-none">{moduleName}</span>
            </div>
          </div>
          
          <Link href="/select-module" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Módulos
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {NAV.filter(({ module }) => {
            if (pathname.startsWith('/dashboard/almacen') || pathname === '/dashboard') return module === 'almacen'
            if (pathname.startsWith('/dashboard/produccion')) return module === 'produccion'
            if (pathname.startsWith('/dashboard/maestros') || pathname.startsWith('/dashboard/personal')) return module === 'maestros'
            return true
          }).map(({ group, items }) => (
          <div key={group}>
            {/* Si se desean separar por grupos se puede dejar el título, pero en AESA no suele haber titulo de grupo visible en la imagen, lo omitimos visualmente o lo dejamos sutil */}
            <ul className="space-y-1.5">
              {items.map(({ label, href }) => {
                const active = pathname.startsWith(href) || (pathname === '/dashboard' && href === '/dashboard/produccion') // Fallback logic
                return (
                  <li key={href}>
                    <Link href={href} onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        active 
                          ? 'bg-[#c83232] text-white shadow-md' 
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}>
                      {/* Icono genérico por defecto, puedes personalizar por cada ítem */}
                      <svg className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Sidebar */}
      <div className="px-4 pb-6 mt-auto pt-4 border-t border-white/10">

        {/* Usuario */}
        <div className="flex items-center gap-3 px-4 py-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-[#c83232] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#c83232]/20">
            <span className="text-white text-xs font-bold">
              {user?.nombre ? user.nombre.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase() : 'U'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.nombre ?? 'Usuario'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.acceso ?? 'Rol'}</p>
          </div>
        </div>

        <Link href="/select-module" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Configuración
        </Link>
        <button onClick={logout} className="w-full mt-2 flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-400 hover:text-[#c83232] hover:bg-white/5 rounded-xl transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f4f5]">
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
        <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-0">{children}</main>
      </div>

      {/* Toast global siempre presente */}
      <ToastContainer />
    </div>
  )
}
