'use client'

import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Material } from '@/types/database'

interface ModalMaterialProps {
  onClose: () => void
  onSaved: () => void
  familiasExistentes: string[]
  unidadesExistentes: string[]
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

// Unidades más comunes por defecto
const UNIDADES_DEFAULT = ['UND', 'PZA', 'M', 'KG', 'L', 'GL', 'CJ', 'BL', 'PAR', 'JGO']

export default function ModalMaterial({ onClose, onSaved, familiasExistentes, unidadesExistentes }: ModalMaterialProps) {
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
  
  // Opciones combinadas de unidades
  const unidadesOpciones = useMemo(() => {
    const un = new Set([...UNIDADES_DEFAULT, ...unidadesExistentes])
    return Array.from(un).filter(Boolean).sort()
  }, [unidadesExistentes])

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
      <div className="bg-[#e4e9f2] border border-slate-300 rounded-lg w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Encabezado Azul Oscuro */}
        <div className="bg-[#1e235a] text-white text-center py-4 px-6 shadow-md relative">
          <h2 className="text-2xl font-bold tracking-wide">CREACION DE CODIGOS DE MATERIALES</h2>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Cuerpo Dividido en 2 Columnas */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Lado Izquierdo: Formulario */}
          <div className="md:w-1/2 p-8 border-r border-slate-300/50 overflow-y-auto relative">
            <div className="space-y-6">
              
              {/* Familia */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">FAMILIA</label>
                <div className="flex-1">
                  <input type="text" list="familias-list" value={form.familia} onChange={e => setForm({...form, familia: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black"/>
                  <datalist id="familias-list">
                    {familiasExistentes.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
              </div>

              {/* Sub Familia */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">SUB FAMILIA</label>
                <div className="flex-1">
                  <input type="text" value={form.subfamilia} onChange={e => setForm({...form, subfamilia: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black"/>
                </div>
              </div>

              {/* Descripcion */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">DESCRIPCION</label>
                <div className="flex-1">
                  <input type="text" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black"/>
                </div>
              </div>

              {/* Unidad */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">UNIDAD</label>
                <div className="flex-1">
                  <input type="text" list="unidades-list" value={form.unidad_medida} onChange={e => setForm({...form, unidad_medida: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black"/>
                  <datalist id="unidades-list">
                    {unidadesOpciones.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>

              {/* N Parte */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">N° PARTE</label>
                <div className="flex-1">
                  <input type="text" value={form.numero_parte} onChange={e => setForm({...form, numero_parte: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black"/>
                </div>
              </div>

              {/* Modelo */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">MODELO</label>
                <div className="flex-1">
                  <input type="text" value={form.marca_equipo} onChange={e => setForm({...form, marca_equipo: e.target.value.toUpperCase()})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black"/>
                </div>
              </div>

              {/* Activo */}
              <div className="flex items-center gap-4">
                <label className="w-32 font-bold text-sm text-[#1e235a]">ACTIVO</label>
                <div className="flex-1">
                  <select value={form.activo} onChange={e => setForm({...form, activo: e.target.value})}
                    className="w-full border-2 border-[#1e235a] rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1e235a]/50 text-sm font-semibold text-brand-black bg-white">
                    <option value="SI">SI</option>
                    <option value="NO">NO</option>
                  </select>
                </div>
              </div>

            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-100 border-l-4 border-red-600 text-red-800 text-sm font-bold">
                {error}
              </div>
            )}
            {!error && esValido && (
              <div className="mt-8">
                <span className="text-red-600 font-bold text-sm">OK</span>
              </div>
            )}
            
            {/* Decoración visual lateral que se veía en la imagen (barra azul a la izquierda) */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#4c63b6] opacity-50 pointer-events-none"></div>
          </div>

          {/* Lado Derecho: Preview */}
          <div className="md:w-1/2 p-8 bg-white flex flex-col">
            
            {/* Cuadro de Código Generado */}
            <div className="bg-[#1e235a] text-center p-6 rounded mb-8 shadow-md">
              <h3 className="text-white font-bold text-lg mb-2">CODIGO DE NUEVO MATERIAL</h3>
              {cargandoPreview ? (
                <div className="h-8 flex items-center justify-center">
                  <span className="text-white/60 animate-pulse font-bold">Calculando...</span>
                </div>
              ) : (
                <div className="text-white font-extrabold text-3xl tracking-[0.2em]">
                  {preview?.codigo || '----------'}
                </div>
              )}
            </div>

            {/* Tabla de Similares */}
            <div className="flex-1 flex flex-col">
              <h4 className="text-[#1e235a] font-extrabold text-sm mb-2 uppercase leading-tight">
                Lista de Materiales dentro de la Subfamilia y Grupo Alfabetico
              </h4>
              <div className="border-2 border-[#1e235a] rounded flex-1 overflow-hidden flex flex-col">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#1e235a] text-white">
                    <tr>
                      <th className="px-3 py-2 font-semibold">COD2</th>
                      <th className="px-3 py-2 font-semibold">NUEVA DESCRIPCION</th>
                      <th className="px-3 py-2 font-semibold w-24">NEW UM</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {cargandoPreview ? (
                       <tr>
                         <td colSpan={3} className="p-8 text-center text-brand-gray font-medium">Buscando...</td>
                       </tr>
                    ) : preview?.similares && preview.similares.length > 0 ? (
                      preview.similares.map((sim, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="px-3 py-2 text-brand-gray font-mono">{sim.cod2}</td>
                          <td className="px-3 py-2 text-brand-black font-semibold text-xs">{sim.descripcion}</td>
                          <td className="px-3 py-2 text-brand-gray text-xs">{sim.unidad_medida}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-brand-gray font-medium">
                          {form.familia && form.descripcion ? 'No se encontraron materiales en este grupo.' : 'Ingresa datos para previsualizar.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={guardar}
                disabled={!esValido || guardando || cargandoPreview}
                className="bg-[#1e235a] hover:bg-blue-900 active:scale-95 text-white font-bold text-lg px-8 py-4 rounded shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {guardando ? 'GUARDANDO...' : 'AGREGAR-MATERIAL'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
