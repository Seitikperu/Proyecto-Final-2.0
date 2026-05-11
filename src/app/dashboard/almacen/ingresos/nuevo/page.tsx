'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { BackButton } from '@/components/ui/BackButton'
import type { Material, Proveedor } from '@/types/database'

const sb = getSupabaseClient()

// ── Tipos ─────────────────────────────────────────────────────────────
interface ItemIngreso {
  _key: number
  codigo: string
  descripcion: string
  unidad: string
  familia: string
  marca: string
  cantidad: number
  pu_usd: number
  total: number
  moneda: 'USD' | 'C$'
  ubicacion: string
  observacion: string
  n_parte?: string
}

interface Cabecera {
  fecha: string
  almacen: string
  origen: string
  tipo_documento: string
  numero_documento: string
  numero_orden_compra: string
  solpe_rq_oc: string
  proveedor: string
  recibido_por: string
  procesado_por: string
  numero_ot: string
}

const today = () => new Date().toISOString().slice(0, 10)

export default function NuevoIngresoPage() {
  // ── Estado Cabecera ──
  const [cab, setCab] = useState<Cabecera>({
    fecha: today(), almacen: 'Unidad Jabalí', origen: '',
    tipo_documento: '', numero_documento: '', numero_orden_compra: '',
    solpe_rq_oc: '', proveedor: '', recibido_por: '', procesado_por: '', numero_ot: ''
  })

  // ── Estado Material Actual ──
  const [busqCod, setBusqCod] = useState('')
  const [sugerencias, setSugerencias] = useState<Material[]>([])
  const [matSel, setMatSel] = useState<Material | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [puUsd, setPuUsd] = useState('')
  const [moneda, setMoneda] = useState<'USD' | 'C$'>('USD')
  const [ubicacion, setUbicacion] = useState('')
  const [nParte, setNParte] = useState('')
  const [observacion, setObservacion] = useState('')

  // ── Lista Acumulada ──
  const [items, setItems] = useState<ItemIngreso[]>([])
  const keyRef = useRef(0)

  // ── Catálogos ──
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [personal, setPersonal] = useState<{ trabajador: string }[]>([])
  const [origenes, setOrigenes] = useState<string[]>([])
  const [tiposDocs, setTiposDocs] = useState<string[]>([])

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Cargar Catálogos ──
  useEffect(() => {
    sb.from('proveedores').select('proveedor').eq('activo', true).order('proveedor').limit(500)
      .then(({ data }) => setProveedores((data ?? []) as Proveedor[]))

    sb.from('personal').select('trabajador').eq('Acceso_Almacen', 'SI').order('trabajador').limit(500)
      .then(({ data }) => setPersonal(data ?? []))

    sb.from('cat_origen').select('valor').order('valor').limit(100)
      .then(({ data }) => setOrigenes((data ?? []).map((r: { valor: string }) => r.valor)))

    sb.from('cat_tipo_documento').select('valor').order('valor').limit(100)
      .then(({ data }) => setTiposDocs((data ?? []).map((r: { valor: string }) => r.valor)))
  }, [])

  // ── Búsqueda Material ──
  const buscarMaterial = useCallback(async (q: string) => {
    if (q.length < 2) { setSugerencias([]); return }
    const { data } = await sb.from('materiales')
      .select('id,codigo,descripcion,unidad_medida,familia,marca_equipo,ubicacion_jabali,activo')
      .or(`codigo.ilike.%${q}%,descripcion.ilike.%${q}%`)
      .limit(30)
      
    const validos = (data ?? []).filter((m: any) => m.activo !== 'NO').slice(0, 10)
    setSugerencias(validos as Material[])
  }, [])

  useEffect(() => {
    const t = setTimeout(() => buscarMaterial(busqCod), 300)
    return () => clearTimeout(t)
  }, [busqCod, buscarMaterial])

  const seleccionarMaterial = (m: Material) => {
    setMatSel(m)
    setBusqCod(m.codigo)
    setSugerencias([])
    setUbicacion(m.ubicacion_jabali ?? '')
  }

  // ── Lógica Items ──
  const total = parseFloat(cantidad || '0') * parseFloat(puUsd || '0')
  const puedeAgregar = matSel && parseFloat(cantidad) > 0

  const agregarItem = () => {
    if (!matSel || !puedeAgregar) return
    setItems(prev => [...prev, {
      _key: keyRef.current++,
      codigo: matSel.codigo,
      descripcion: matSel.descripcion ?? '',
      unidad: matSel.unidad_medida ?? '',
      familia: matSel.familia ?? '',
      marca: matSel.marca_equipo ?? '',
      cantidad: parseFloat(cantidad),
      pu_usd: parseFloat(puUsd || '0'),
      total,
      moneda,
      ubicacion,
      observacion,
      n_parte: nParte
    }])
    
    // Limpiar campos del ítem actual (para seguir agregando rápido)
    setBusqCod(''); setMatSel(null); setCantidad(''); setPuUsd(''); setUbicacion(''); setNParte('')
  }

  const eliminarItem = (key: number) => setItems(prev => prev.filter(i => i._key !== key))

  // ── Guardado ──
  const cabOk = cab.fecha && cab.almacen && cab.origen && cab.proveedor && cab.recibido_por

  const guardarBD = async () => {
    if (!cabOk || items.length === 0) return
    setGuardando(true); setError(null)
    try {
      const rows = items.map(it => ({
        fecha: cab.fecha,
        mes: cab.fecha.slice(0, 7),
        almacen: cab.almacen,
        origen: cab.origen,
        tipo_documento: cab.tipo_documento || null,
        numero_documento: cab.numero_documento || null,
        numero_orden_compra: cab.numero_orden_compra || null,
        solpe_rq_oc: cab.solpe_rq_oc || null,
        proveedor: cab.proveedor,
        recibido_por: cab.recibido_por,
        procesado_por: cab.procesado_por || null,
        codigo: it.codigo,
        descripcion: it.descripcion,
        unidad: it.unidad,
        familia: it.familia,
        marca: it.n_parte || it.marca || null, // Guardamos el número de parte si existe
        cantidad: it.cantidad,
        pu_usd: it.pu_usd || null,
        total: it.total || null,
        moneda: it.moneda,
        iva: 'NO',
        ubicacion: it.ubicacion || null,
        observacion: it.observacion || cab.numero_ot || null, // Incluimos info de la cabecera si aplica
      }))
      const { error: err } = await sb.from('ingreso_almacen').insert(rows)
      if (err) throw err
      
      showToast('success', '¡Ingreso registrado!', 'Los datos se guardaron correctamente en BD.')
      // Redirigimos a la lista principal después de 1 segundo
      setTimeout(() => {
        window.location.href = '/dashboard/almacen/ingresos'
      }, 1000)
      
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      setError(msg)
      showToast('error', 'Error al guardar', msg)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-light flex flex-col px-4 py-6">
      <div className="max-w-[1600px] w-full mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Cabecera / Título */}
        <div className="bg-brand-black px-6 py-4 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-white tracking-wide">NUEVO INGRESO ALMACÉN</h1>
          </div>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Fila 1 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">FECHA <span className="text-brand-red">*</span></label>
              <input type="date" value={cab.fecha} onChange={e => setCab(c => ({ ...c, fecha: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">ALMACÉN <span className="text-brand-red">*</span></label>
              <select value={cab.almacen} onChange={e => setCab(c => ({ ...c, almacen: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all">
                <option>Unidad Jabalí</option>
                <option>Managua</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">ORIGEN <span className="text-brand-red">*</span></label>
              <select value={cab.origen} onChange={e => setCab(c => ({ ...c, origen: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all">
                <option value="">-- Seleccionar --</option>
                {origenes.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">TIPO DOC.</label>
              <select value={cab.tipo_documento} onChange={e => setCab(c => ({ ...c, tipo_documento: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all">
                <option value="">-- Seleccionar --</option>
                {tiposDocs.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">N° OT</label>
              <input type="text" value={cab.numero_ot} onChange={e => setCab(c => ({ ...c, numero_ot: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">PROVEEDOR <span className="text-brand-red">*</span></label>
              <SearchableSelect
                value={cab.proveedor}
                onChange={val => setCab(c => ({ ...c, proveedor: val }))}
                options={proveedores.map(p => ({ value: p.proveedor, label: p.proveedor }))}
                placeholder="-- Buscar --"
                className="!bg-slate-50 !border-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">N° DOCUMENTO</label>
              <input type="text" value={cab.numero_documento} onChange={e => setCab(c => ({ ...c, numero_documento: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">N° ORDEN COMPRA</label>
              <input type="text" value={cab.numero_orden_compra} onChange={e => setCab(c => ({ ...c, numero_orden_compra: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">RECIBIDO POR <span className="text-brand-red">*</span></label>
              <SearchableSelect
                value={cab.recibido_por}
                onChange={val => setCab(c => ({ ...c, recibido_por: val }))}
                options={personal.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                placeholder="-- Seleccionar --"
                className="!bg-slate-50 !border-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">SOLPE/RQ/OC</label>
              <input type="text" value={cab.solpe_rq_oc} onChange={e => setCab(c => ({ ...c, solpe_rq_oc: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Fila 3 - Ítem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 relative">
            <div className="relative">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">CÓD. MAT <span className="text-brand-red">*</span></label>
              <input type="text" value={busqCod} onChange={e => { setBusqCod(e.target.value); setMatSel(null) }}
                placeholder="Buscar código..."
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
              {sugerencias.length > 0 && (
                <ul className="absolute z-20 mt-1 w-[300px] bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {sugerencias.map(m => (
                    <li key={m.id} onClick={() => seleccionarMaterial(m)}
                      className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                      <span className="text-brand-black font-bold text-xs bg-slate-100 px-1.5 rounded border border-slate-200 mr-2">{m.codigo}</span>
                      <span className="text-brand-black text-xs">{m.descripcion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">CANTIDAD <span className="text-brand-red">*</span></label>
              <input type="number" min="0" step="any" value={cantidad} onChange={e => setCantidad(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">P.U. MONTO</label>
              <input type="number" min="0" step="any" value={puUsd} onChange={e => setPuUsd(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">MONEDA</label>
              <select value={moneda} onChange={e => setMoneda(e.target.value as 'USD' | 'C$')}
                className="w-full bg-slate-100 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm font-semibold">
                <option>USD</option>
                <option>C$</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">UBICACIÓN</label>
              <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          {/* Fila 4 - Material Info */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">MATERIAL</label>
              <div className="w-full bg-brand-black border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-semibold min-h-[34px] flex items-center">
                {matSel?.descripcion || <span className="text-slate-500 italic">Auto-completado</span>}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">UM</label>
              <input readOnly value={matSel?.unidad_medida ?? ''}
                className="w-full bg-slate-100 border border-slate-200 text-brand-gray rounded-lg px-3 py-1.5 text-sm font-medium" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">N° PARTE</label>
              <input type="text" value={nParte} onChange={e => setNParte(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          {/* Fila 5 - Botones y Obs */}
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">OBSERVACIÓN</label>
              <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            
            <div className="flex gap-3">
              <button onClick={agregarItem} disabled={!puedeAgregar}
                className="bg-white border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white font-extrabold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white tracking-widest text-sm">
                AGREGAR
              </button>
              
              <button onClick={guardarBD} disabled={!cabOk || items.length === 0 || guardando}
                className="bg-brand-black text-white hover:bg-slate-800 font-extrabold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-300 tracking-widest text-sm flex items-center gap-2">
                {guardando ? 'GUARDANDO...' : 'REGISTRAR A BD'}
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</p>}
          {!cabOk && <p className="text-amber-600 text-xs font-bold">⚠ Completa los campos de cabecera (*)</p>}

        </div>

        {/* ── TABLA DE ÍTEMS ── */}
        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-brand-black text-white">
              <tr>
                {['FECHA','ORIGEN','T. DOC','PROVEEDOR','N° DOC','N° COMPRA','RECIBIDO','CÓD. MAT','MATERIAL','UM','CANT','P.U.','TOTAL','MONED','OBSERVACIÓN','BORRAR'].map(h => (
                  <th key={h} className="text-left font-bold tracking-wider px-3 py-2 whitespace-nowrap border-r border-slate-700 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={16} className="text-center py-10 text-brand-gray font-medium">No se han agregado materiales.</td></tr>
              ) : items.map((it, i) => (
                <tr key={it._key} className={`border-b border-slate-200 ${i%2===0?'bg-white':'bg-slate-50'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">{cab.fecha}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{cab.origen || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{cab.tipo_documento || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={cab.proveedor}>{cab.proveedor || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{cab.numero_documento || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{cab.numero_orden_compra || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={cab.recibido_por}>{cab.recibido_por || '-'}</td>
                  <td className="px-3 py-2 font-bold whitespace-nowrap">{it.codigo}</td>
                  <td className="px-3 py-2 max-w-[150px] truncate" title={it.descripcion}>{it.descripcion}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.unidad}</td>
                  <td className="px-3 py-2 text-right font-bold">{it.cantidad}</td>
                  <td className="px-3 py-2 text-right">{it.pu_usd ? it.pu_usd.toFixed(2) : '-'}</td>
                  <td className="px-3 py-2 text-right text-green-700 font-bold">{it.total ? it.total.toFixed(2) : '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.moneda}</td>
                  <td className="px-3 py-2 max-w-[100px] truncate" title={it.observacion}>{it.observacion || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => eliminarItem(it._key)} className="text-brand-red font-bold hover:text-red-700">X</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
