'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CisUser {
  id: number
  nombre: string
  acceso: string | null
}

interface Proyecto {
  id: number
  nombre: string
  icono?: string
}

function IconAlmacen() {
  return (
    <svg className="w-14 h-14" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 28L32 8l28 20v28a2 2 0 01-2 2H6a2 2 0 01-2-2V28z" />
      <rect x="22" y="38" width="20" height="18" rx="1" />
      <circle cx="18" cy="44" r="3" fill="currentColor" stroke="none" />
      <circle cx="46" cy="44" r="3" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconProduccion() {
  return (
    <svg className="w-14 h-14" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="32" cy="32" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M32 8v8M32 48v8M8 32h8M48 32h8M16 16l5.5 5.5M42.5 42.5L48 48M48 16l-5.5 5.5M21.5 42.5L16 48" />
    </svg>
  )
}

function IconMaestros() {
  return (
    <svg className="w-14 h-14" fill="none" viewBox="0 0 64 64" stroke="currentColor" strokeWidth={1.5}>
      <ellipse cx="32" cy="18" rx="20" ry="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v12c0 4.418 8.954 8 20 8s20-3.582 20-8V18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 30v12c0 4.418 8.954 8 20 8s20-3.582 20-8V30" />
    </svg>
  )
}

const MODULES = [
  {
    id: 'almacen',
    label: 'Almacen',
    description: 'Ingresos, salidas, stock e inventario de materiales',
    href: '/dashboard/almacen/ingresos',
    gradient: 'from-orange-500 to-amber-500',
    shadowColor: 'hover:shadow-orange-500/25',
    borderColor: 'border-orange-500/20',
    textColor: 'text-orange-400',
    bgIcon: 'bg-orange-500/10',
    ringHover: 'hover:ring-orange-500/40',
    subItems: ['Dashboard', 'Ingresos', 'Salidas', 'Stock', 'Inventario'],
    Icon: IconAlmacen,
  },
  {
    id: 'produccion',
    label: 'Produccion',
    description: 'Control diario, plan mensual, explosivos y vibraciones',
    href: '/dashboard/produccion',
    gradient: 'from-blue-500 to-cyan-500',
    shadowColor: 'hover:shadow-blue-500/25',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-400',
    bgIcon: 'bg-blue-500/10',
    ringHover: 'hover:ring-blue-500/40',
    subItems: ['Control Diario', 'Plan Mensual', 'Explosivos', 'Vibraciones'],
    Icon: IconProduccion,
  },
  {
    id: 'maestros',
    label: 'Maestros',
    description: 'Proveedores, CeCos, personal, equipos, materiales y labores',
    href: '/dashboard/maestros/proveedores',
    gradient: 'from-emerald-500 to-teal-500',
    shadowColor: 'hover:shadow-emerald-500/25',
    borderColor: 'border-emerald-500/20',
    textColor: 'text-emerald-400',
    bgIcon: 'bg-emerald-500/10',
    ringHover: 'hover:ring-emerald-500/40',
    subItems: ['Proveedores', 'CeCos', 'Personal', 'Equipos', 'Materiales', 'Labores'],
    Icon: IconMaestros,
  },
]

export default function SelectModulePage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<CisUser | null>(null)
  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [hovering, setHovering] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    try {
      const rawUser = sessionStorage.getItem('cis_usuario')
      if (!rawUser) { router.replace('/login'); return }
      setUsuario(JSON.parse(rawUser) as CisUser)
      const rawP = sessionStorage.getItem('cis_proyecto')
      if (!rawP) { router.replace('/select-project'); return }
      setProyecto(JSON.parse(rawP) as Proyecto)
    } catch {
      router.replace('/login')
    }
  }, [router])

  function handleSelect(mod: typeof MODULES[0]) {
    setSelecting(mod.id)
    setTimeout(() => router.push(mod.href), 280)
  }

  if (!usuario || !proyecto) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <header className="border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">CIS Nicaragua</p>
              <p className="text-slate-500 text-xs">Unidad Minera Jabali</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-slate-500 text-xs">Proyecto</p>
              <p className="text-white text-sm font-medium">{proyecto.nombre}</p>
            </div>
            <button
              onClick={() => router.push('/select-project')}
              className="text-slate-500 hover:text-slate-300 transition-colors text-xs border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5"
            >
              Cambiar proyecto
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <span className="text-blue-400 text-xs font-semibold">
                {usuario.nombre?.charAt(0).toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-10">
            <p className="text-slate-500 text-sm mb-1 uppercase tracking-widest font-medium">Bienvenido</p>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Selecciona un modulo
            </h1>
            <p className="text-slate-400 text-base">
              Hola <span className="text-white font-medium">{usuario.nombre}</span>, selecciona el area de trabajo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {MODULES.map((mod) => {
              const { Icon } = mod
              const isHov = hovering === mod.id
              const isSel = selecting === mod.id
              return (
                <button
                  key={mod.id}
                  onClick={() => handleSelect(mod)}
                  onMouseEnter={() => setHovering(mod.id)}
                  onMouseLeave={() => setHovering(null)}
                  disabled={!!selecting}
                  className={[
                    'group relative flex flex-col items-center text-center rounded-2xl border bg-slate-900/80',
                    'p-7 transition-all duration-300 cursor-pointer outline-none ring-2 ring-transparent',
                    mod.borderColor, mod.ringHover, mod.shadowColor,
                    isHov ? 'shadow-2xl -translate-y-2' : 'shadow-none translate-y-0',
                    isSel ? 'scale-95 opacity-60' : 'scale-100 opacity-100',
                  ].join(' ')}
                >
                  <div className={'absolute inset-0 rounded-2xl bg-gradient-to-br ' + mod.gradient + ' opacity-0 group-hover:opacity-5 transition-opacity duration-300'} />

                  <div className={[
                    'relative w-28 h-28 rounded-full flex items-center justify-center mb-5',
                    mod.bgIcon, 'border', mod.borderColor,
                    'transition-transform duration-300',
                    isHov ? 'scale-110' : 'scale-100',
                  ].join(' ')}>
                    <div className={'absolute inset-0 rounded-full bg-gradient-to-br ' + mod.gradient + ' opacity-0 group-hover:opacity-20 transition-opacity duration-300'} />
                    <div className={'relative ' + mod.textColor}>
                      <Icon />
                    </div>
                  </div>

                  <h2 className={'text-xl font-bold mb-1.5 ' + mod.textColor}>{mod.label}</h2>
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed px-2">{mod.description}</p>

                  <div className="flex flex-wrap gap-1.5 justify-center mb-5">
                    {mod.subItems.map(item => (
                      <span
                        key={item}
                        className={[
                          'text-xs px-2.5 py-0.5 rounded-full',
                          mod.bgIcon, mod.textColor, 'border', mod.borderColor,
                        ].join(' ')}
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className={[
                    'w-full py-2.5 rounded-xl text-white text-sm font-semibold',
                    'bg-gradient-to-r', mod.gradient,
                    'transition-all duration-300',
                    isHov ? 'shadow-lg opacity-100' : 'opacity-75',
                  ].join(' ')}>
                    {isSel ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Cargando...
                      </span>
                    ) : 'Ingresar'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/60 py-3 text-center">
        <p className="text-slate-700 text-xs">CIS Nicaragua - Sistema de Gestion Minera 2026</p>
      </footer>
    </div>
  )
}
