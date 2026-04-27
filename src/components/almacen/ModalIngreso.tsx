'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { Material, Proveedor } from '@/types/database'

const sb = getSupabaseClient()

// ── tipos locales ─────────────────────────────────────────────────────────────
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
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

// ── helpers ───────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10)

export default function ModalIngreso({ onClose, onSaved }: Props) {
  // cabecera
  const [cab, setCab] = useState<Cabecera>({
    fecha: today(), almacen: 'Unidad Jabalí', origen: '',
    tipo_documento: '', numero_documento: '', numero_orden_compra: '',
    solpe_rq_oc: '', proveedor: '', recibido_por: '', procesado_por: '',
  })

  // ítem actual
  const [busqCod, setBusqCod] = useState('')
  const [sugerencias, setSugerencias] = useState<Material[]>([])
  const [matSel, setMatSel] = useState<Material | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [puUsd, setPuUsd] = useState('')
  const [moneda, setMoneda] = useState<'USD' | 'C$'>('USD')
  const [ubicacion, setUbicacion] = useState('')
  const [observacion, setObservacion] = useState('')

  // lista acumulada
  const [items, setItems] = useState<ItemIngreso[]>([])
  const keyRef = useRef(0)

  // catálogos
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [personal, setPersonal] = useState<{ trabajador: string }[]>([])
  const [origenes, setOrigenes] = useState<string[]>([])
  const [tiposDocs, setTiposDocs] = useState<string[]>([])

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── cargar catálogos al montar ───────────────────────────────────────────
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

  // ── búsqueda de material por código ─────────────────────────────────────
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

  // ── calcular total ───────────────────────────────────────────────────────
  const total = parseFloat(cantidad || '0') * parseFloat(puUsd || '0')

  // ── agregar ítem ─────────────────────────────────────────────────────────
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
    }])
    // limpiar ítem
    setBusqCod(''); setMatSel(null); setCantidad(''); setPuUsd('')
    setUbicacion(''); setObservacion('')
  }

  const eliminarItem = (key: number) => setItems(prev => prev.filter(i => i._key !== key))

  // ── validar cabecera mínima ──────────────────────────────────────────────
  const cabOk = cab.fecha && cab.almacen && cab.origen && cab.proveedor && cab.recibido_por

  // ── guardar todos los ítems ──────────────────────────────────────────────
  const guardar = async () => {
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
        marca: it.marca || null,
        cantidad: it.cantidad,
        pu_usd: it.pu_usd || null,
        total: it.total || null,
        moneda: it.moneda,
        iva: 'NO',
        ubicacion: it.ubicacion || null,
        observacion: it.observacion || null,
      }))
      const { error: err } = await sb.from('ingreso_almacen').insert(rows)
      if (err) throw err
      onSaved()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al guardar'
      setError(msg)
      showToast('error', 'Error al guardar ingreso', msg)
    } finally {
      setGuardando(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-sm text-white shadow-md shadow-brand-red/20">📥</div>
            <div>
              <h2 className="text-brand-black font-extrabold text-base">Nuevo Ingreso al Almacén</h2>
              <p className="text-brand-gray text-xs font-medium">{items.length === 0 ? 'Agrega materiales antes de guardar' : `${items.length} ítem${items.length > 1 ? 's' : ''} acumulado${items.length > 1 ? 's' : ''}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-brand-black hover:bg-slate-200 rounded-lg p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ── SECCIÓN 1: Cabecera del documento ── */}
          <section>
            <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">Datos del documento</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Fecha <span className="text-brand-red">*</span></label>
                <input type="date" value={cab.fecha} onChange={e => setCab(c => ({ ...c, fecha: e.target.value }))}
                  className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Almacén <span className="text-brand-red">*</span></label>
                <select value={cab.almacen} onChange={e => setCab(c => ({ ...c, almacen: e.target.value }))}
                  className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                  <option>Unidad Jabalí</option>
                  <option>Managua</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Origen <span className="text-brand-red">*</span></label>
                <select value={cab.origen} onChange={e => setCab(c => ({ ...c, origen: e.target.value }))}
                  className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                  <option value="">-- Seleccionar --</option>
                  {origenes.map(o => <option key={o}>{o}</option>)}
                  {origenes.length === 0 && <><option>Compra Local</option><option>Importación</option><option>Transferencia</option><option>Donación</option></>}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Tipo Documento</label>
                <select value={cab.tipo_documento} onChange={e => setCab(c => ({ ...c, tipo_documento: e.target.value }))}
                  className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                  <option value="">-- Seleccionar --</option>
                  {tiposDocs.map(t => <option key={t}>{t}</option>)}
                  {tiposDocs.length === 0 && <><option>Factura</option><option>Guía de Remisión</option><option>Orden de Compra</option><option>Recibo</option></>}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">N° Documento</label>
                <input type="text" value={cab.numero_documento} onChange={e => setCab(c => ({ ...c, numero_documento: e.target.value }))}
                  placeholder="Ej: F-00123"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">N° Orden Compra</label>
                <input type="text" value={cab.numero_orden_compra} onChange={e => setCab(c => ({ ...c, numero_orden_compra: e.target.value }))}
                  placeholder="Ej: OC-2024-001"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">SOLPE/RQ/OC</label>
                <input type="text" value={cab.solpe_rq_oc} onChange={e => setCab(c => ({ ...c, solpe_rq_oc: e.target.value }))}
                  placeholder="Ej: RQ-0045"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Proveedor <span className="text-brand-red">*</span></label>
                <SearchableSelect
                  value={cab.proveedor}
                  onChange={val => setCab(c => ({ ...c, proveedor: val }))}
                  options={proveedores.map(p => ({ value: p.proveedor, label: p.proveedor }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-white !border-slate-300 !text-brand-black shadow-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Recibido por <span className="text-brand-red">*</span></label>
                <SearchableSelect
                  value={cab.recibido_por}
                  onChange={val => setCab(c => ({ ...c, recibido_por: val }))}
                  options={personal.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-white !border-slate-300 !text-brand-black shadow-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Procesado por</label>
                <SearchableSelect
                  value={cab.procesado_por}
                  onChange={val => setCab(c => ({ ...c, procesado_por: val }))}
                  options={personal.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-white !border-slate-300 !text-brand-black shadow-sm"
                />
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 2: Agregar material ── */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-inner">
            <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">Agregar material</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              {/* Búsqueda por código/descripción */}
              <div className="md:col-span-2 relative">
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Código material</label>
                <input type="text" value={busqCod} onChange={e => { setBusqCod(e.target.value); setMatSel(null) }}
                  placeholder="Escribir código o descripción…"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
                {sugerencias.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {sugerencias.map(m => (
                      <li key={m.id} onClick={() => seleccionarMaterial(m)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors">
                        <p className="text-brand-black font-bold text-xs bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200 mb-1">{m.codigo}</p>
                        <p className="text-brand-black text-xs font-medium">{m.descripcion}</p>
                        <p className="text-brand-gray text-[10px] mt-0.5 font-semibold">{m.unidad_medida} · {m.familia}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Descripción</label>
                <input readOnly value={matSel?.descripcion ?? ''}
                  className="w-full bg-slate-100 border border-slate-200 text-brand-gray rounded-xl px-3 py-2 text-sm cursor-not-allowed font-medium" placeholder="Auto"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">U.M.</label>
                <input readOnly value={matSel?.unidad_medida ?? ''}
                  className="w-full bg-slate-100 border border-slate-200 text-brand-gray rounded-xl px-3 py-2 text-sm cursor-not-allowed font-medium" placeholder="Auto"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Cantidad <span className="text-brand-red">*</span></label>
                <input type="number" min="0" step="any" value={cantidad} onChange={e => setCantidad(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Precio Unit. (USD)</label>
                <input type="number" min="0" step="any" value={puUsd} onChange={e => setPuUsd(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Total USD</label>
                <input readOnly value={total > 0 ? total.toFixed(2) : ''}
                  className="w-full bg-slate-100 border border-slate-200 text-green-700 font-bold rounded-xl px-3 py-2 text-sm" placeholder="Auto"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Moneda</label>
                <select value={moneda} onChange={e => setMoneda(e.target.value as 'USD' | 'C$')}
                  className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                  <option>USD</option>
                  <option>C$</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Ubicación</label>
                <input type="text" value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                  placeholder="Ej: Rack A-3"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-brand-gray mb-1 block">Observación</label>
                <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={agregarItem} disabled={!puedeAgregar}
                className="flex items-center gap-2 bg-brand-red hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white text-sm font-bold px-5 py-2 rounded-xl transition-all shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 active:scale-95">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Agregar ítem
              </button>
            </div>
          </section>

          {/* ── SECCIÓN 3: Tabla de ítems acumulados ── */}
          {items.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">
                Ítems a guardar ({items.length})
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Código','Descripción','UM','Cantidad','P.U. USD','Total USD','Moneda',''].map(h => (
                        <th key={h} className="text-left text-brand-gray font-bold uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={it._key} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i%2===0?'bg-white':'bg-slate-50/50'}`}>
                        <td className="px-4 py-2.5"><code className="text-brand-black font-semibold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">{it.codigo}</code></td>
                        <td className="px-4 py-2.5 text-brand-black font-medium max-w-xs"><p className="truncate">{it.descripcion}</p></td>
                        <td className="px-4 py-2.5 text-brand-gray font-medium">{it.unidad}</td>
                        <td className="px-4 py-2.5 text-right text-brand-black font-semibold">{it.cantidad.toLocaleString('es-NI')}</td>
                        <td className="px-4 py-2.5 text-right text-brand-gray">{it.pu_usd > 0 ? it.pu_usd.toFixed(2) : '—'}</td>
                        <td className="px-4 py-2.5 text-right text-green-700 font-bold">{it.total > 0 ? '$' + it.total.toFixed(2) : '—'}</td>
                        <td className="px-4 py-2.5 text-brand-gray">{it.moneda}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => eliminarItem(it._key)} className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t border-slate-200">
                      <td colSpan={5} className="px-4 py-3 text-brand-gray font-bold text-right uppercase tracking-wider">Total general:</td>
                      <td className="px-4 py-3 text-green-700 font-bold text-right text-sm">
                        ${items.reduce((s, i) => s + i.total, 0).toFixed(2)}
                      </td>
                      <td colSpan={2}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <p className="text-brand-gray font-medium text-xs">
            {!cabOk && '⚠ Completa los campos obligatorios (*)'}
            {cabOk && items.length === 0 && '⚠ Agrega al menos un ítem'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-black rounded-xl hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!cabOk || items.length === 0 || guardando}
              className="flex items-center gap-2 bg-brand-red hover:bg-red-700 disabled:bg-slate-300 disabled:text-white disabled:shadow-none text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 active:scale-95">
              {guardando ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Guardando…</>
              ) : (
                <>💾 Guardar {items.length > 0 ? `(${items.length} ítem${items.length > 1 ? 's' : ''})` : ''}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
