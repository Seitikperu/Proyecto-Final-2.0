'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type RolGlobal = 'administrador' | 'supervisor' | 'operador' | 'solo_lectura'

export interface PermisoSeccion {
    modulo: string
    seccion: string
    puede_ver: boolean
    puede_crear: boolean
}

export interface UsuarioConPermisos {
    id: number
    nombre: string
    rol_global: RolGlobal
    id_personal: string
}

interface PermisosCtx {
    usuario: UsuarioConPermisos | null
    permisos: PermisoSeccion[]
    cargando: boolean
    puedeVer: (modulo: string, seccion: string) => boolean
    puedeCrear: (modulo: string, seccion: string) => boolean
    cargarPermisos: (usuarioId: number, proyectoId: number) => Promise<void>
    setUsuario: (u: UsuarioConPermisos | null) => void
}

const Ctx = createContext<PermisosCtx>({
    usuario: null,
    permisos: [],
    cargando: false,
    puedeVer: () => false,
    puedeCrear: () => false,
    cargarPermisos: async () => {},
    setUsuario: () => {},
})

const SESSION_KEY_USUARIO = 'cis_usuario'
const SESSION_KEY_PERMISOS = 'cis_permisos'

export function PermisosProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuarioState] = useState<UsuarioConPermisos | null>(null)
    const [permisos, setPermisos] = useState<PermisoSeccion[]>([])
    const [cargando, setCargando] = useState(false)

  // Restaurar sesion al cargar
  useEffect(() => {
        try {
                const rawU = sessionStorage.getItem(SESSION_KEY_USUARIO)
                const rawP = sessionStorage.getItem(SESSION_KEY_PERMISOS)
                if (rawU) setUsuarioState(JSON.parse(rawU))
                if (rawP) setPermisos(JSON.parse(rawP))
        } catch { /* silencio */ }
  }, [])

  function setUsuario(u: UsuarioConPermisos | null) {
        setUsuarioState(u)
        if (u) sessionStorage.setItem(SESSION_KEY_USUARIO, JSON.stringify(u))
        else sessionStorage.removeItem(SESSION_KEY_USUARIO)
  }

  async function cargarPermisos(usuarioId: number, proyectoId: number) {
        setCargando(true)
        try {
                const supabase = createClient()
                const { data } = await supabase
                  .from('permisos_usuario')
                  .select('modulo, seccion, puede_ver, puede_crear')
                  .eq('usuario_id', usuarioId)
                  .eq('proyecto_id', proyectoId)
                  .eq('activo', true)
                const lista: PermisoSeccion[] = data || []
                        setPermisos(lista)
                sessionStorage.setItem(SESSION_KEY_PERMISOS, JSON.stringify(lista))
        } catch { /* silencio */ } finally {
                setCargando(false)
        }
  }

  function puedeVer(modulo: string, seccion: string): boolean {
        // Administrador tiene acceso total
      if (usuario?.rol_global === 'administrador') return true
        const p = permisos.find(x => x.modulo === modulo && x.seccion === seccion)
        return p?.puede_ver ?? false
  }

  function puedeCrear(modulo: string, seccion: string): boolean {
        // Administrador tiene acceso total
      if (usuario?.rol_global === 'administrador') return true
        // Solo_lectura nunca puede crear
      if (usuario?.rol_global === 'solo_lectura') return false
        const p = permisos.find(x => x.modulo === modulo && x.seccion === seccion)
        return p?.puede_crear ?? false
  }

  return (
        <Ctx.Provider value={{ usuario, permisos, cargando, puedeVer, puedeCrear, cargarPermisos, setUsuario }}>
          {children}
        </Ctx.Provider>
                    )
}

// ── Hook de uso ───────────────────────────────────────────────────────────────
export function usePermisos() {
    return useContext(Ctx)
}
