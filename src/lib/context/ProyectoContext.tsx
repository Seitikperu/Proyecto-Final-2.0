'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ── Definición de proyectos ───────────────────────────────────────────────────
export interface Proyecto {
  id: string          // clave usada en filtros Supabase  (campo `almacen`)
  nombre: string      // nombre visible en UI
  descripcion: string
  icono: string       // emoji
  color: string       // clase Tailwind de color
  colorBg: string
  activo: boolean
}

export const PROYECTOS: Proyecto[] = [
  {
    id:          'ALM_01',
    nombre:      'Mina Jabalí',
    descripcion: 'Unidad Minera Jabalí — Nicaragua',
    icono:       '⛏️',
    color:       'text-blue-400',
    colorBg:     'bg-blue-500/10 border-blue-500/30',
    activo:      true,
  },
  {
    id:          'BELLAVISTA',
    nombre:      'Mina Bellavista',
    descripcion: 'Unidad Minera Bellavista — Costa Rica',
    icono:       '🏔️',
    color:       'text-emerald-400',
    colorBg:     'bg-emerald-500/10 border-emerald-500/30',
    activo:      true,
  },
  {
    id:          'MANAGUA',
    nombre:      'Managua',
    descripcion: 'Oficina Central — Managua, Nicaragua',
    icono:       '🏢',
    color:       'text-violet-400',
    colorBg:     'bg-violet-500/10 border-violet-500/30',
    activo:      true,
  },
]

const SESSION_KEY = 'cis_proyecto'

// ── Contexto ──────────────────────────────────────────────────────────────────
interface ProyectoCtx {
  proyecto: Proyecto | null
  setProyecto: (p: Proyecto) => void
  clearProyecto: () => void
}

const Ctx = createContext<ProyectoCtx>({
  proyecto:     null,
  setProyecto:  () => {},
  clearProyecto:() => {},
})

export function ProyectoProvider({ children }: { children: ReactNode }) {
  const [proyecto, setProyectoState] = useState<Proyecto | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) setProyectoState(JSON.parse(raw) as Proyecto)
    } catch { /* silencio */ }
  }, [])

  function setProyecto(p: Proyecto) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(p))
    setProyectoState(p)
  }

  function clearProyecto() {
    sessionStorage.removeItem(SESSION_KEY)
    setProyectoState(null)
  }

  return <Ctx.Provider value={{ proyecto, setProyecto, clearProyecto }}>{children}</Ctx.Provider>
}

// ── Hook de uso ───────────────────────────────────────────────────────────────
export function useProyecto() {
  return useContext(Ctx)
}
