'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

const sb = getSupabaseClient()

// Iconos y colores por tipo de proyecto
const ESTILO: Record<string, { icono: string; color: string; colorBg: string }> = {
  'Mina Jabalí':     { icono: '⛏️', color: 'text-blue-400',   colorBg: 'bg-blue-500/10 border-blue-500/30' },
  'Mina Bellavista': { icono: '🏔️', color: 'text-emerald-400',colorBg: 'bg-emerald-500/10 border-emerald-500/30' },
  'Managua':         { icono: '🏢', color: 'text-violet-400', colorBg: 'bg-viohlet-500/10 border-violet-500/30' },
  _default:          { icono: '📁', color: 'text-slate-400',  colorBg: 'bg-slate-500/10 border-slate-500/30' },
}

function estilo(nombre: string) {
  return ESTILO[nombre] ?? ESTILO['_default']
}

interface Proyecto {
  id: number
  nombre: string
  descripcion: string | null
  ubicacion: string | null
  pais: string | null
  tipo: string | null
}

interface CisUser {
  id: number
  nombre: string
}

export default function SelectProjectPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<CisUser | null>(null)
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [cargando, setCargando] = useState(true)
  const [hovering, setHovering] = useState<number | null>(null)
  const [selecting, setSelecting] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // ── Verificar sesión y cargar proyectos del usuario ──────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('cis_usuario')
      if (!raw) { router.replace('/login'); return }
      const u = JSON.parse(raw) as CisUser
      setUsuario(u)
      cargarProyectos(u.id)
    } catch {
      router.replace('/login')
    }
  }, [router])

  async function cargarProyectos(usuarioId: number) {
    setCargando(true)
    setErrorMsg(null)
    try {
      // Obtener proyecto_ids del usuario
      const { data: upData, error: upErr } = await sb
        .from('usuario_proyecto')
        .select('proyecto_id')
        .eq('usuario_id', usuarioId)
        .eq('activo', true)

      if (upErr) throw upErr

      const ids = (upData ?? []).map((r: { proyecto_id: number }) => r.proyecto_id)

      if (ids.length === 0) {
        setProyectos([])
        return
      }

      // Obtener detalles de los proyectos accesibles
      const { data: pData, error: pErr } = await sb
        .from('proyectos')
        .select('id, nombre, descripcion, ubicacion, pais, tipo')
        .in('id', ids)
        .eq('activo', true)
        .order('nombre')

      if (pErr) throw pErr
      setProyectos((pData ?? []) as Proyecto[])
    } catch (e) {
      console.error(e)
      setErrorMsg('No se pudieron cargar los proyectos. Verifica tu conexión.')
    } finally {
      setCargando(false)
    }
  }

  function seleccionar(p: Proyecto) {
    setSelecting(p.id)
    // Guardar proyecto en sessionStorage
    sessionStorage.setItem('cis_proyecto', JSON.stringify({
      id:          p.id,
      nombre:      p.nombre,
      descripcion: p.descripcion,
      ...estilo(p.nombre),
    }))
    setTimeout(() => router.push('/select-module'), 350)
  }

  function cerrarSesion() {
    sessionStorage.removeItem('cis_usuario')
    sessionStorage.removeItem('cis_proyecto')
    router.push('/login')
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (cargando) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <span className="text-sm">Cargando proyectos…</span>
      </div>
    </div>
  )

  // ── SIN ACCESO ─────────────────────────────────────────────────────────────
  if (!cargando && proyectos.length === 0 && !errorMsg) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 p-6">
      <div className="text-5xl">🔒</div>
      <h2 className="text-white font-bold text-xl">Sin proyectos asignados</h2>
      <p className="text-slate-400 text-sm text-center max-w-sm">
        Tu usuario no tiene acceso a ningún proyecto activo. Contacta al administrador del sistema.
      </p>
      <button onClick={cerrarSesion} className="mt-4 text-sm text-red-400 hover:text-red-300 underline">
        Cerrar sesión
      </button>
    </div>
  )

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-sm">CIS Nicaragua</span>
        </div>
        <div className="flex items-center gap-3">
          {usuario && (
            <span className="text-slate-400 text-sm">
              Bienvenido, <span className="text-white font-medium">{usuario.nombre}</span>
            </span>
          )}
          <button onClick={cerrarSesion}
            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
            title="Cerrar sesión">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

        {/* Título */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"/>
            Sistema de Gestión de Almacén
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-3">Selecciona tu Proyecto</h1>
          <p className="text-slate-400 text-base max-w-md">
            Elige la unidad operativa para acceder a sus datos de inventario, ingresos y salidas.
          </p>
          {proyectos.length > 0 && (
            <p className="text-slate-500 text-xs mt-2">
              Tienes acceso a <span className="text-slate-300 font-medium">{proyectos.length}</span> proyecto{proyectos.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="mb-8 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 max-w-md w-full">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p className="text-red-400 text-sm">{errorMsg}</p>
            <button onClick={() => usuario && cargarProyectos(usuario.id)}
              className="ml-auto text-red-400 hover:text-red-300 text-xs underline whitespace-nowrap">
              Reintentar
            </button>
          </div>
        )}

        {/* Tarjetas de proyecto */}
        <div className={`grid gap-5 w-full max-w-4xl ${
          proyectos.length === 1 ? 'grid-cols-1 max-w-sm' :
          proyectos.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl' :
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}>
          {proyectos.map(p => {
            const e = estilo(p.nombre)
            const isHover    = hovering  === p.id
            const isSelected = selecting === p.id

            return (
              <button key={p.id} onClick={() => seleccionar(p)}
                onMouseEnter={() => setHovering(p.id)}
                onMouseLeave={() => setHovering(null)}
                disabled={!!selecting}
                className={`relative group text-left rounded-2xl border p-6 transition-all duration-300 overflow-hidden cursor-pointer
                  ${isSelected ? `${e.colorBg} scale-95 shadow-2xl` :
                    isHover   ? `${e.colorBg} scale-[1.02] shadow-xl` :
                    'bg-slate-900 border-slate-800 hover:scale-[1.02]'}`}>

                {/* Shimmer */}
                <div className={`absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent
                  transition-opacity duration-300 ${isHover || isSelected ? 'opacity-100' : 'opacity-0'}`}/>

                {/* Check de selección */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                )}

                {/* Icono */}
                <div className={`w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center text-2xl mb-4
                  ${isHover || isSelected ? 'bg-slate-700' : ''} transition-colors`}>
                  {isSelected
                    ? <svg className="w-6 h-6 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    : e.icono
                  }
                </div>

                {/* Texto */}
                <h2 className={`text-lg font-bold mb-1 transition-colors ${isHover || isSelected ? e.color : 'text-white'}`}>
                  {p.nombre}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">{p.descripcion}</p>
                {p.ubicacion && (
                  <p className="text-slate-600 text-xs mt-1">📍 {p.ubicacion}{p.pais ? `, ${p.pais}` : ''}</p>
                )}

                {/* Badge tipo */}
                <div className="mt-4 flex items-center gap-2">
                  {p.tipo && (
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">{p.tipo}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
                    Activo
                  </span>
                </div>

                {/* Flecha */}
                <div className={`absolute bottom-5 right-5 transition-all duration-300 ${isHover && !isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                  <svg className={`w-5 h-5 ${e.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </div>
              </button>
            )
          })}
        </div>

        {/* Nota */}
        <div className="mt-10 flex items-start gap-2.5 bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 max-w-xl w-full">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-slate-400 text-xs leading-relaxed">
            Los datos del dashboard se filtran automáticamente según el proyecto seleccionado.
            Puedes cambiar de proyecto desde el menú lateral en cualquier momento.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-slate-700 text-xs">© 2025 CIS Nicaragua · v2.0</p>
      </footer>
    </div>
  )
}
