'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'

const sb = getSupabaseClient()

// Iconos y colores por tipo de proyecto
const ESTILO: Record<string, { icono: string; color: string; colorBg: string }> = {
  'Mina Jabalí':     { icono: '⛏️', color: 'text-brand-red',   colorBg: 'bg-brand-red/5 border-brand-red/30' },
  'Mina Bellavista': { icono: '🏔️', color: 'text-brand-black',colorBg: 'bg-brand-gray/5 border-brand-black/30' },
  'Managua':         { icono: '🏢', color: 'text-brand-gray', colorBg: 'bg-brand-gray/10 border-brand-gray/30' },
  _default:          { icono: '📁', color: 'text-brand-gray',  colorBg: 'bg-brand-gray/5 border-brand-gray/20' },
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
      const raw = localStorage.getItem('cis_usuario')
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
    // Guardar proyecto en localStorage
    localStorage.setItem('cis_proyecto', JSON.stringify({
      id:          p.id,
      nombre:      p.nombre,
      descripcion: p.descripcion,
      ...estilo(p.nombre),
    }))
    setTimeout(() => router.push('/select-module'), 350)
  }

  async function cerrarSesion() {
    await sb.auth.signOut()
    localStorage.removeItem('cis_usuario')
    localStorage.removeItem('cis_proyecto')
    router.push('/login')
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (cargando) return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center">
      <div className="flex items-center gap-3 text-brand-gray">
        <svg className="w-5 h-5 animate-spin text-brand-red" fill="none" viewBox="0 0 24 24">
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
    <div className="min-h-screen bg-brand-light flex flex-col" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <span className="text-brand-black font-semibold text-sm">CIS Nicaragua</span>
        </div>
        <div className="flex items-center gap-3">
          {usuario && (
            <span className="text-brand-gray text-sm">
              Bienvenido, <span className="text-brand-black font-medium">{usuario.nombre}</span>
            </span>
          )}
          <button onClick={cerrarSesion}
            className="text-brand-gray hover:text-brand-red transition-colors p-1.5 rounded-lg hover:bg-slate-100"
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
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-red uppercase tracking-widest bg-brand-red/10 border border-brand-red/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"/>
            Sistema de Gestión de Almacén
          </div>
          <h1 className="text-3xl font-extrabold text-brand-black mb-3">Selecciona tu Proyecto</h1>
          <p className="text-brand-gray text-base max-w-md">
            Elige la unidad operativa para acceder a sus datos de inventario, ingresos y salidas.
          </p>
          {proyectos.length > 0 && (
            <p className="text-brand-gray/80 text-xs mt-2">
              Tienes acceso a <span className="text-brand-black font-medium">{proyectos.length}</span> proyecto{proyectos.length > 1 ? 's' : ''}
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
                  ${isSelected ? `${e.colorBg} scale-95 shadow-xl` :
                    isHover   ? `${e.colorBg} scale-[1.02] shadow-lg` :
                    'bg-white border-slate-200 hover:scale-[1.02]'}`}>

                {/* Shimmer */}
                <div className={`absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-transparent
                  transition-opacity duration-300 ${isHover || isSelected ? 'opacity-100' : 'opacity-0'}`}/>

                {/* Check de selección */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-brand-red flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                )}

                {/* Icono */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4
                  ${isHover || isSelected ? 'bg-slate-100' : 'bg-slate-50'} transition-colors`}>
                  {isSelected
                    ? <svg className="w-6 h-6 text-brand-red animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    : e.icono
                  }
                </div>

                {/* Texto */}
                <h2 className={`text-lg font-bold mb-1 transition-colors ${isHover || isSelected ? e.color : 'text-brand-black'}`}>
                  {p.nombre}
                </h2>
                <p className="text-brand-gray text-sm leading-relaxed">{p.descripcion}</p>
                {p.ubicacion && (
                  <p className="text-slate-600 text-xs mt-1">📍 {p.ubicacion}{p.pais ? `, ${p.pais}` : ''}</p>
                )}

                {/* Badge tipo */}
                <div className="mt-4 flex items-center gap-2">
                  {p.tipo && (
                    <span className="text-xs bg-slate-100 text-brand-gray px-2 py-0.5 rounded font-mono">{p.tipo}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-brand-red">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"/>
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
        <div className="mt-10 flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl px-5 py-3 max-w-xl w-full">
          <svg className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p className="text-brand-gray text-xs leading-relaxed">
            Los datos del dashboard se filtran automáticamente según el proyecto seleccionado.
            Puedes cambiar de proyecto desde el menú lateral en cualquier momento.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-brand-gray/60 text-xs">© 2026 CIS Nicaragua · v2.0</p>
      </footer>
    </div>
  )
}
