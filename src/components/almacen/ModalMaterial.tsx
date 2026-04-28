'use client'

import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Material } from '@/types/database'

interface ModalMaterialProps {
  onClose: () => void
  onSaved: () => void
}

interface PreviewResult {
  codigo: string
  cod_familia: string
  cod_subfamilia: string
  cod_abcd: string
  cod_descripcion: string
  similares: {
    cod2: string
    descripcion: string
    unidad_medida: string
  }[]
}

const UNIDADES_DEFAULT = ['UND', 'PZA', 'M', 'KG', 'L', 'GL', 'CJ', 'BL', 'PAR', 'JGO']

export default function ModalMaterial({ onClose, onSaved }: ModalMaterialProps) {
  const [form, setForm] = useState({
    familia: '',
    subfamilia: '',
    descripcion: '',
    unidad_medida: 'UND',
    numero_parte: '',
    marca_equipo: '', // Modelo
    activo: 'SI'
  })

  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [cargandoPreview, setCargandoPreview] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rawData, setRawData] = useState<any[]>([])

  const [listas, setListas] = useState({
    familias: [] as string[],
    unidades: UNIDADES_DEFAULT,
    numerosParte: [] as string[],
    modelos: [] as string[]
  })

  // Cargar todos los datos una vez
  useEffect(() => {
    async function fetchListas() {
      const sb = getSupabaseClient()
      const { data } = await sb.from('materiales').select('familia, subfamilia, descripcion, unidad_medida, numero_parte, marca_equipo')
      if (data) {
        setRawData(data)
        setListas({
          familias: Array.from(new Set(data.map(d => d.familia).filter(Boolean))) as string[],
          unidades: Array.from(new Set([...UNIDADES_DEFAULT, ...data.map(d => d.unidad_medida).filter(Boolean)])) as string[],
          numerosParte: Array.from(new Set(data.map(d => d.numero_parte).filter(Boolean))) as string[],
          modelos: Array.from(new Set(data.map(d => d.marca_equipo).filter(Boolean))) as string[],
        })
      }
    }
    fetchListas()
  }, [])

  // Listas filtradas en cascada (dependientes)
  const subfamiliasFiltradas = useMemo(() => {
    if (!form.familia) return Array.from(new Set(rawData.map(d => d.subfamilia).filter(Boolean))) as string[]
    return Array.from(new Set(rawData.filter(d => d.familia === form.familia).map(d => d.subfamilia).filter(Boolean))) as string[]
  }, [rawData, form.familia])

  const descripcionesFiltradas = useMemo(() => {
    let filtered = rawData
    if (form.familia) filtered = filtered.filter(d => d.familia === form.familia)
    if (form.subfamilia) filtered = filtered.filter(d => d.subfamilia === form.subfamilia)
    
    return Array.from(new Set(filtered.map(d => d.descripcion).filter(Boolean))) as string[]
  }, [rawData, form.familia, form.subfamilia])

  // Validaciones
  const esValido = form.familia.trim() && form.subfamilia.trim() && form.descripcion.trim() && form.unidad_medida.trim()

  // Efecto para buscar el preview con debounce
  useEffect(() => {
    if (!form.familia.trim() || !form.subfamilia.trim() || !form.descripcion.trim()) {
      setPreview(null)
      return
    }

    const timer = setTimeout(async () => {
      setCargandoPreview(true)
      try {
        const sb = getSupabaseClient()
        const { data, error } = await sb.rpc('fn_preview_codigo_material', {
          p_familia: form.familia,
          p_subfamilia: form.subfamilia,
          p_descripcion: form.descripcion
        })
        
        if (error) throw error
        if (data) {
          setPreview(data as PreviewResult)
        }
      } catch (err) {
        console.error("Error al previsualizar:", err)
      } finally {
        setCargandoPreview(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [form.familia, form.subfamilia, form.descripcion])

  async function guardar() {
    if (!esValido) return
    setGuardando(true)
    setError(null)

    try {
      const sb = getSupabaseClient()
      const { data: userData } = await sb.auth.getUser()
      const correo = userData.user?.email ?? 'sistema'

      const { data, error } = await sb.rpc('fn_crear_material', {
        p_familia: form.familia,
        p_subfamilia: form.subfamilia,
        p_descripcion: form.descripcion,
        p_unidad_medida: form.unidad_medida,
        p_numero_parte: form.numero_parte,
        p_modelo: form.marca_equipo,
        p_activo: form.activo,
        p_creado_por: correo
      })

      if (error) throw error
      
      if (data && !data.success) {
        throw new Error(data.error || 'Error desconocido al guardar.')
      }

      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el Material. Verifica que no sea duplicado.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-light border border-slate-300 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Encabezado Light Mode */}
        <div className="bg-brand-black text-white text-center py-4 px-6 relative">
          <h2 className="text-xl font-bold tracking-wide">Creación de Código de Material</h2>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Cuerpo Dividido en 2 Columnas */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-white">
          
          {/* Lado Izquierdo: Formulario */}
          <div className="md:w-1/2 p-8 border-r border-slate-200 overflow-y-auto relative">
            <div className="space-y-5">
              
              {/* Familia */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">Familia</label>
                <div className="flex-1 relative">
                  <input type="text" list="familias-list" value={form.familia} onChange={e => setForm({...form, familia: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white"/>
                  <datalist id="familias-list">
                    {listas.familias.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
              </div>

              {/* Sub Familia */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">Sub Familia</label>
                <div className="flex-1 relative">
                  <input type="text" list="subfamilias-list" value={form.subfamilia} onChange={e => setForm({...form, subfamilia: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white"/>
                  <datalist id="subfamilias-list">
                    {subfamiliasFiltradas.map(sf => <option key={sf} value={sf} />)}
                  </datalist>
                </div>
              </div>

              {/* Descripcion */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">Descripción</label>
                <div className="flex-1 relative">
                  <input type="text" list="descripciones-list" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white"/>
                  <datalist id="descripciones-list">
                    {descripcionesFiltradas.map(d => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>

              {/* Unidad */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">Unidad</label>
                <div className="flex-1 relative">
                  <input type="text" list="unidades-list" value={form.unidad_medida} onChange={e => setForm({...form, unidad_medida: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white"/>
                  <datalist id="unidades-list">
                    {listas.unidades.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>

              {/* N Parte */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">N° Parte</label>
                <div className="flex-1 relative">
                  <input type="text" list="numeros-parte-list" value={form.numero_parte} onChange={e => setForm({...form, numero_parte: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white"/>
                  <datalist id="numeros-parte-list">
                    {listas.numerosParte.map(n => <option key={n} value={n} />)}
                  </datalist>
                </div>
              </div>

              {/* Modelo */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">Modelo</label>
                <div className="flex-1 relative">
                  <input type="text" list="modelos-list" value={form.marca_equipo} onChange={e => setForm({...form, marca_equipo: e.target.value.toUpperCase()})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white"/>
                  <datalist id="modelos-list">
                    {listas.modelos.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>

              {/* Activo */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-xs text-brand-gray tracking-wider uppercase">Activo</label>
                <div className="flex-1 relative">
                  <select value={form.activo} onChange={e => setForm({...form, activo: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red/50 text-sm font-semibold text-brand-black transition-all bg-slate-50 hover:bg-white cursor-pointer">
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>

            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {error}
              </div>
            )}
            {!error && esValido && (
              <div className="mt-8 flex items-center gap-2 text-green-600 font-bold text-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                Campos requeridos completados
              </div>
            )}
            
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-red opacity-80 pointer-events-none"></div>
          </div>

          {/* Lado Derecho: Preview */}
          <div className="md:w-1/2 p-8 bg-slate-50/50 flex flex-col">
            
            {/* Cuadro de Código Generado */}
            <div className="bg-brand-black text-center p-6 rounded-xl mb-8 shadow-md border border-slate-800">
              <h3 className="text-white/80 font-semibold text-sm mb-2 uppercase tracking-widest">Código Propuesto</h3>
              {cargandoPreview ? (
                <div className="h-10 flex items-center justify-center">
                  <span className="text-white/60 animate-pulse font-medium">Calculando código...</span>
                </div>
              ) : (
                <div className="text-white font-extrabold text-4xl tracking-[0.2em]">
                  {preview?.codigo || '----------'}
                </div>
              )}
            </div>

            {/* Tabla de Similares */}
            <div className="flex-1 flex flex-col">
              <h4 className="text-brand-black font-extrabold text-sm mb-3 uppercase tracking-wide">
                Materiales en Grupo (Subfamilia y Alfabeto)
              </h4>
              <div className="border border-slate-200 rounded-xl flex-1 overflow-hidden flex flex-col bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-brand-gray">
                      <tr>
                        <th className="px-4 py-3 font-bold uppercase text-xs">Cód. Existente</th>
                        <th className="px-4 py-3 font-bold uppercase text-xs">Descripción</th>
                        <th className="px-4 py-3 font-bold uppercase text-xs w-24">UM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cargandoPreview ? (
                         <tr>
                           <td colSpan={3} className="p-8 text-center text-brand-gray font-medium">Buscando coincidencias...</td>
                         </tr>
                      ) : preview?.similares && preview.similares.length > 0 ? (
                        preview.similares.map((sim, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-2.5 text-brand-gray font-mono text-xs">{sim.cod2}</td>
                            <td className="px-4 py-2.5 text-brand-black font-medium text-xs max-w-[200px] truncate" title={sim.descripcion}>{sim.descripcion}</td>
                            <td className="px-4 py-2.5 text-brand-gray text-xs">{sim.unidad_medida}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-12 text-center text-brand-gray">
                            <svg className="w-12 h-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            {form.familia && form.descripcion ? 'No hay materiales en este grupo.' : 'Ingresa Familia, Subfamilia y Descripción para previsualizar.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={guardar}
                disabled={!esValido || guardando || cargandoPreview}
                className="bg-brand-red hover:bg-red-700 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {guardando ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : 'Agregar Material'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
