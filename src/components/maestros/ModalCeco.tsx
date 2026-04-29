'use client'

import { useState, useEffect, useMemo } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { CentroCosto } from '@/types/database'

interface ModalCecoProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalCeco({ onClose, onSaved }: ModalCecoProps) {
  const [form, setForm] = useState({
    unidad_produccion: '',
    tipo_costo: '',
    area: '',
    familia: '',
    subfamilia: '',
    centro_costo: '',
    proveedor: '',
    filtro_almacen: 'SI'
  })

  const [rawData, setRawData] = useState<CentroCosto[]>([])
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<CentroCosto | null>(null)
  const [codigoSugerido, setCodigoSugerido] = useState('')
  
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [cargandoCodigo, setCargandoCodigo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todos los CeCos al montar
  useEffect(() => {
    async function fetchData() {
      try {
        const sb = getSupabaseClient()
        // Cargamos todos los centros de costo para las plantillas y cascadas
        const { data, error } = await sb.from('centros_costo').select('*').order('cod_ceco', { ascending: false })
        if (error) throw error
        if (data) {
          setRawData(data as CentroCosto[])
        }
      } catch (err: any) {
        console.error("Error al cargar centros de costo:", err)
        setError("Error de conexión al cargar maestros.")
      } finally {
        setCargandoDatos(false)
      }
    }
    fetchData()
  }, [])

  // Derivar listas en cascada (distinct)
  const undsProduccion = useMemo(() => Array.from(new Set(rawData.map(d => d.unidad_produccion).filter(Boolean))) as string[], [rawData])
  
  const tiposCosto = useMemo(() => {
    let f = rawData
    if (form.unidad_produccion) f = f.filter(d => d.unidad_produccion === form.unidad_produccion)
    return Array.from(new Set(f.map(d => d.tipo_costo).filter(Boolean))) as string[]
  }, [rawData, form.unidad_produccion])

  const areas = useMemo(() => {
    let f = rawData
    if (form.unidad_produccion) f = f.filter(d => d.unidad_produccion === form.unidad_produccion)
    if (form.tipo_costo) f = f.filter(d => d.tipo_costo === form.tipo_costo)
    return Array.from(new Set(f.map(d => d.area).filter(Boolean))) as string[]
  }, [rawData, form.unidad_produccion, form.tipo_costo])

  const familias = useMemo(() => {
    let f = rawData
    if (form.unidad_produccion) f = f.filter(d => d.unidad_produccion === form.unidad_produccion)
    if (form.tipo_costo) f = f.filter(d => d.tipo_costo === form.tipo_costo)
    if (form.area) f = f.filter(d => d.area === form.area)
    return Array.from(new Set(f.map(d => d.familia).filter(Boolean))) as string[]
  }, [rawData, form.unidad_produccion, form.tipo_costo, form.area])

  const subfamilias = useMemo(() => {
    let f = rawData
    if (form.unidad_produccion) f = f.filter(d => d.unidad_produccion === form.unidad_produccion)
    if (form.tipo_costo) f = f.filter(d => d.tipo_costo === form.tipo_costo)
    if (form.area) f = f.filter(d => d.area === form.area)
    if (form.familia) f = f.filter(d => d.familia === form.familia)
    return Array.from(new Set(f.map(d => d.subfamilia).filter(Boolean))) as string[]
  }, [rawData, form.unidad_produccion, form.tipo_costo, form.area, form.familia])

  // Plantillas filtradas para la tabla lateral
  const plantillasFiltradas = useMemo(() => {
    let f = rawData
    if (form.unidad_produccion) f = f.filter(d => d.unidad_produccion === form.unidad_produccion)
    if (form.tipo_costo) f = f.filter(d => d.tipo_costo === form.tipo_costo)
    if (form.area) f = f.filter(d => d.area === form.area)
    if (form.familia) f = f.filter(d => d.familia === form.familia)
    if (form.subfamilia) f = f.filter(d => d.subfamilia === form.subfamilia)
    return f.slice(0, 50) // Limitar para rendimiento en UI
  }, [rawData, form.unidad_produccion, form.tipo_costo, form.area, form.familia, form.subfamilia])

  // Resetear cascadas hacia abajo cuando cambia un padre superior
  const handleChange = (campo: keyof typeof form, valor: string) => {
    setForm(prev => {
      const next = { ...prev, [campo]: valor.toUpperCase() }
      if (campo === 'unidad_produccion') {
        next.tipo_costo = ''; next.area = ''; next.familia = ''; next.subfamilia = '';
      } else if (campo === 'tipo_costo') {
        next.area = ''; next.familia = ''; next.subfamilia = '';
      } else if (campo === 'area') {
        next.familia = ''; next.subfamilia = '';
      } else if (campo === 'familia') {
        next.subfamilia = '';
      }
      return next
    })
    
    // Si cambiamos los filtros, la plantilla seleccionada se invalida (a menos que siga coincidiendo, pero mejor resetear)
    setPlantillaSeleccionada(null)
    setCodigoSugerido('')
  }

  // Lógica para auto-generar el código del CeCo
  useEffect(() => {
    if (!plantillaSeleccionada || !plantillaSeleccionada.cod_ceco) {
      setCodigoSugerido('')
      return
    }

    async function generarCodigo() {
      setCargandoCodigo(true)
      try {
        const sb = getSupabaseClient()
        let codBaseStr = plantillaSeleccionada!.cod_ceco!
        
        // Asumiendo codigos numericos. Buscamos el siguiente disponible sumando 1
        let iteraciones = 0
        let nuevoNum = Number(codBaseStr) + 1
        let nuevoCod = String(nuevoNum).padStart(12, '0')

        while (iteraciones < 200) {
          const { data } = await sb.from('centros_costo').select('id').eq('cod_ceco', nuevoCod).single()
          if (!data) {
            setCodigoSugerido(nuevoCod)
            break
          }
          nuevoNum++
          nuevoCod = String(nuevoNum).padStart(12, '0')
          iteraciones++
        }
      } catch (err) {
        console.error("Error al generar código", err)
      } finally {
        setCargandoCodigo(false)
      }
    }
    
    generarCodigo()
  }, [plantillaSeleccionada])

  const esValido = !!plantillaSeleccionada && !!codigoSugerido && form.centro_costo.trim().length > 0 &&
                   form.unidad_produccion && form.tipo_costo && form.area && form.familia && form.subfamilia

  async function guardar() {
    if (!esValido || !plantillaSeleccionada) return
    setGuardando(true)
    setError(null)

    try {
      const sb = getSupabaseClient()
      
      // Calcular nv6 y nv7 como se solicitó (usando las posiciones solicitadas)
      const cod = codigoSugerido
      const nv6 = cod.slice(7, 9)
      const nv7 = cod.slice(9, 11)
      const proyecto = plantillaSeleccionada.proyecto_nombre || 'Mina Jabalí'

      const nuevoRegistro = {
        cod_ceco: codigoSugerido,
        centro_costo: form.centro_costo.toUpperCase(),
        proveedor: form.proveedor.toUpperCase() || null,
        filtro_almacen: form.filtro_almacen,
        
        // Heredar
        corporativo: plantillaSeleccionada.corporativo,
        unidad_negocio: plantillaSeleccionada.unidad_negocio,
        unidad_produccion: plantillaSeleccionada.unidad_produccion,
        tipo_costo: plantillaSeleccionada.tipo_costo,
        area: plantillaSeleccionada.area,
        familia: plantillaSeleccionada.familia,
        subfamilia: plantillaSeleccionada.subfamilia,
        proyecto_nombre: proyecto,
        
        // Niveles 1-5 heredados de la plantilla
        nv1: plantillaSeleccionada.nv1,
        nv2: plantillaSeleccionada.nv2,
        nv3: plantillaSeleccionada.nv3,
        nv4: plantillaSeleccionada.nv4,
        nv5: plantillaSeleccionada.nv5,
        
        // Niveles 6 y 7 calculados
        nv6: nv6,
        nv7: nv7,
        
        creado_en: new Date().toISOString()
      }

      const { error: insErr } = await sb.from('centros_costo').insert([nuevoRegistro])
      if (insErr) throw insErr
      
      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el Centro de Costo.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-brand-light border border-slate-300 rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Encabezado */}
        <div className="bg-brand-black text-white text-center py-4 px-6 relative">
          <h2 className="text-xl font-bold tracking-wide flex items-center justify-center gap-2">
            <span className="text-brand-red">💰</span> Creación de Centro de Costo (CeCo)
          </h2>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-white">
          
          {/* Lado Izquierdo: Formulario */}
          <div className="lg:w-2/5 p-8 border-r border-slate-200 overflow-y-auto relative flex flex-col gap-5">
            <p className="text-sm text-brand-gray mb-2 font-medium">1. Selecciona los niveles para filtrar las plantillas</p>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Unidad de Producción</label>
                <input type="text" list="up-list" value={form.unidad_produccion} onChange={e => handleChange('unidad_produccion', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-brand-black bg-slate-50 focus:ring-2 focus:ring-brand-red/50 focus:outline-none"/>
                <datalist id="up-list">{undsProduccion.map(v => <option key={v} value={v}/>)}</datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Tipo de Costo</label>
                <input type="text" list="tc-list" value={form.tipo_costo} onChange={e => handleChange('tipo_costo', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-brand-black bg-slate-50 focus:ring-2 focus:ring-brand-red/50 focus:outline-none"/>
                <datalist id="tc-list">{tiposCosto.map(v => <option key={v} value={v}/>)}</datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Área</label>
                <input type="text" list="area-list" value={form.area} onChange={e => handleChange('area', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-brand-black bg-slate-50 focus:ring-2 focus:ring-brand-red/50 focus:outline-none"/>
                <datalist id="area-list">{areas.map(v => <option key={v} value={v}/>)}</datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Familia</label>
                <input type="text" list="fam-list" value={form.familia} onChange={e => handleChange('familia', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-brand-black bg-slate-50 focus:ring-2 focus:ring-brand-red/50 focus:outline-none"/>
                <datalist id="fam-list">{familias.map(v => <option key={v} value={v}/>)}</datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Sub Familia</label>
                <input type="text" list="sf-list" value={form.subfamilia} onChange={e => handleChange('subfamilia', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-brand-black bg-slate-50 focus:ring-2 focus:ring-brand-red/50 focus:outline-none"/>
                <datalist id="sf-list">{subfamilias.map(v => <option key={v} value={v}/>)}</datalist>
              </div>
            </div>

            <hr className="my-2 border-slate-200" />
            <p className="text-sm text-brand-gray font-medium">2. Ingresa los datos del nuevo CeCo</p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Nombre / Descripción <span className="text-brand-red">*</span></label>
                <input type="text" value={form.centro_costo} onChange={e => setForm({...form, centro_costo: e.target.value.toUpperCase()})}
                  disabled={!plantillaSeleccionada}
                  placeholder={!plantillaSeleccionada ? "Selecciona una plantilla primero..." : "Ej: MTTO JABALI"}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-brand-black focus:ring-2 focus:ring-brand-red disabled:opacity-50 disabled:bg-slate-100"/>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Proveedor</label>
                <input type="text" value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value.toUpperCase()})}
                  disabled={!plantillaSeleccionada}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-brand-black focus:ring-2 focus:ring-brand-red disabled:opacity-50 disabled:bg-slate-100"/>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-xs text-brand-gray uppercase tracking-wider">Filtro Almacén</label>
                <select value={form.filtro_almacen} onChange={e => setForm({...form, filtro_almacen: e.target.value})}
                  disabled={!plantillaSeleccionada}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-brand-black cursor-pointer focus:ring-2 focus:ring-brand-red disabled:opacity-50 disabled:bg-slate-100">
                  <option value="SI">SÍ - Disponible en almacén</option>
                  <option value="NO">NO - Oculto</option>
                </select>
              </div>
            </div>

            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-red opacity-80 pointer-events-none"></div>
          </div>

          {/* Lado Derecho: Preview y Tabla de Plantillas */}
          <div className="lg:w-3/5 p-8 bg-slate-50/50 flex flex-col gap-6 overflow-hidden">
            
            <div className="flex gap-4">
              <div className="flex-1 bg-brand-black text-center p-6 rounded-xl shadow-md border border-slate-800">
                <h3 className="text-white/80 font-semibold text-sm mb-2 uppercase tracking-widest">Código CeCo Base</h3>
                <div className="text-white/50 font-mono text-2xl">
                  {plantillaSeleccionada?.cod_ceco || '------------'}
                </div>
              </div>
              <div className="flex-1 bg-brand-red text-center p-6 rounded-xl shadow-md border border-red-800 relative overflow-hidden">
                <h3 className="text-white/90 font-bold text-sm mb-2 uppercase tracking-widest">Nuevo Código Generado</h3>
                {cargandoCodigo ? (
                   <div className="text-white/60 animate-pulse font-medium text-lg mt-1">Calculando...</div>
                ) : (
                  <div className="text-white font-extrabold font-mono text-3xl tracking-widest drop-shadow-md">
                    {codigoSugerido || '------------'}
                  </div>
                )}
                <div className="absolute top-0 right-0 p-2 text-white/20">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h4 className="text-brand-black font-bold text-sm uppercase tracking-wide">
                  Seleccionar Plantilla ({plantillasFiltradas.length})
                </h4>
              </div>
              <div className="overflow-y-auto flex-1">
                {cargandoDatos ? (
                  <div className="p-8 text-center text-brand-gray">Cargando maestros...</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white sticky top-0 border-b border-slate-100 z-10 shadow-sm">
                      <tr className="text-brand-gray">
                        <th className="px-4 py-2 font-bold text-xs uppercase">Selec.</th>
                        <th className="px-4 py-2 font-bold text-xs uppercase">Cod. CeCo</th>
                        <th className="px-4 py-2 font-bold text-xs uppercase">Descripción</th>
                        <th className="px-4 py-2 font-bold text-xs uppercase">Familia / Sub</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {plantillasFiltradas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-brand-gray">
                            No se encontraron CeCos con los filtros actuales.
                          </td>
                        </tr>
                      ) : (
                        plantillasFiltradas.map((c) => (
                          <tr 
                            key={c.id} 
                            onClick={() => setPlantillaSeleccionada(c)}
                            className={`cursor-pointer transition-colors ${plantillaSeleccionada?.id === c.id ? 'bg-red-50/60' : 'hover:bg-slate-50'}`}
                          >
                            <td className="px-4 py-3 text-center w-12">
                              <input 
                                type="radio" 
                                readOnly
                                checked={plantillaSeleccionada?.id === c.id}
                                className="w-4 h-4 text-brand-red focus:ring-brand-red cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-brand-black text-xs font-semibold">{c.cod_ceco}</td>
                            <td className="px-4 py-3 text-brand-gray text-xs font-medium max-w-[200px] truncate" title={c.centro_costo || ''}>{c.centro_costo}</td>
                            <td className="px-4 py-3 text-brand-gray text-xs truncate max-w-[150px]">
                              {c.familia} / {c.subfamilia}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-2">
              {!plantillaSeleccionada && (
                <span className="text-brand-red font-semibold text-sm self-center mr-4">Selecciona el CeCo correcto como plantilla</span>
              )}
              <button
                onClick={guardar}
                disabled={!esValido || guardando || cargandoCodigo}
                className="bg-brand-red hover:bg-red-700 active:scale-95 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {guardando ? 'Guardando...' : 'Guardar Nuevo CeCo'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
