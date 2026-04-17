'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { Material, CentroCosto } from '@/types/database'

const sb = getSupabaseClient()

// ── tipos locales ─────────────────────────────────────────────────────────────
interface ItemSalida {
  _key: number
  codigo: string
  descripcion: string
  unidad: string
  familia: string
  cantidad: number
  numero_vale: string
  numero_ot: string
  actividad: string
  centro_costo: string
  uso_especifico: string
  observacion: string
  pu_usd: number
  total: number
}

interface Cabecera {
  fecha: string
  almacen: string
  turno: string
  solicitante: string
  autorizado_por: string
  despachador: string
  empresa_area: string
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

export default function ModalSalida({ onClose, onSaved }: Props) {
  // cabecera
  const [cab, setCab] = useState<Cabecera>({
    fecha: today(), almacen: 'Unidad Jabalí', turno: 'DIA',
    solicitante: '', autorizado_por: '', despachador: '', empresa_area: '',
  })

  // ítem actual
  const [busqCod, setBusqCod] = useState('')
  const [sugerencias, setSugerencias] = useState<Material[]>([])
  const [matSel, setMatSel] = useState<Material | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [nroVale, setNroVale] = useState('')
  const [nroOt, setNroOt] = useState('')
  const [actividad, setActividad] = useState('')
  const [centroCosto, setCentroCosto] = useState('')
  const [usoEspecifico, setUsoEspecifico] = useState('')
  const [observacion, setObservacion] = useState('')
  const [puUsd, setPuUsd] = useState(0)
  const [stockDisp, setStockDisp] = useState(0)
  
  // lista acumulada
  const [items, setItems] = useState<ItemSalida[]>([])
  const keyRef = useRef(0)

  // catálogos
  const [solicitantes, setSolicitantes] = useState<{ trabajador: string }[]>([])
  const [despachadores, setDespachadores] = useState<{ trabajador: string }[]>([])
  const [aprobadores, setAprobadores] = useState<{ trabajador: string }[]>([])
  const [centros, setCentros] = useState<CentroCosto[]>([])

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── cargar catálogos ─────────────────────────────────────────────────────
  useEffect(() => {
    // solicitantes: todas las personas
    sb.from('personal').select('trabajador').order('trabajador').limit(800)
      .then(({ data }) => setSolicitantes(data ?? []))

    // despachadores: Acceso_Almacen = 'SI'
    sb.from('personal').select('trabajador').eq('Acceso_Almacen', 'SI').order('trabajador').limit(500)
      .then(({ data }) => setDespachadores(data ?? []))

    // autorizados por: autorizacion_salm = 'SI'
    sb.from('personal').select('trabajador').eq('autorizacion_salm', 'SI').order('trabajador').limit(500)
      .then(({ data }) => setAprobadores(data ?? []))

    // centros de costo
    sb.from('centros_costo').select('id,cod_ceco,centro_costo,area').eq('filtro_almacen', 'SI').order('cod_ceco').limit(500)
      .then(({ data }) => setCentros((data ?? []) as CentroCosto[]))
  }, [])

  // ── búsqueda de material ─────────────────────────────────────────────────
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

  const seleccionarMaterial = async (m: Material) => {
    setMatSel(m); setBusqCod(m.codigo); setSugerencias([])
    setPuUsd(0)
    setStockDisp(0)
    // Fetch Precio Promedio Ponderado and Stock
    const { data } = await sb.rpc('get_stock_and_pu', { p_codigo: m.codigo })
    if (data) {
      setPuUsd(Number((data as any).pu_usd || 0))
      setStockDisp(Number((data as any).stock || 0))
    }
  }

  // ── agregar ítem ─────────────────────────────────────────────────────────
  const totalItem = parseFloat(cantidad || '0') * puUsd
  const puedeAgregar = Boolean(matSel && parseFloat(cantidad) > 0 && parseFloat(cantidad) <= stockDisp)

  const agregarItem = () => {
    if (!matSel || !puedeAgregar) return
    setItems(prev => [...prev, {
      _key: keyRef.current++,
      codigo: matSel.codigo,
      descripcion: matSel.descripcion ?? '',
      unidad: matSel.unidad_medida ?? '',
      familia: matSel.familia ?? '',
      cantidad: parseFloat(cantidad),
      numero_vale: nroVale,
      numero_ot: nroOt,
      actividad,
      centro_costo: centroCosto,
      uso_especifico: usoEspecifico,
      observacion,
      pu_usd: puUsd,
      total: totalItem,
    }])
    setBusqCod(''); setMatSel(null); setCantidad(''); setNroVale('')
    setNroOt(''); setObservacion(''); setPuUsd(0); setStockDisp(0)
  }

  const eliminarItem = (key: number) => setItems(prev => prev.filter(i => i._key !== key))

  // ── validar cabecera ─────────────────────────────────────────────────────
  const cabOk = cab.fecha && cab.almacen && cab.solicitante

  // ── guardar ──────────────────────────────────────────────────────────────
  const guardar = async () => {
    if (!cabOk || items.length === 0) return
    setGuardando(true); setError(null)
    try {
      const rows = items.map(it => ({
        fecha: cab.fecha,
        almacen: cab.almacen,
        codigo: it.codigo,
        descripcion: it.descripcion,
        unidad_medida: it.unidad,
        familia: it.familia,
        cantidad: it.cantidad,
        numero_vale: it.numero_vale || null,
        numero_ot: it.numero_ot || null,
        actividad: it.actividad || null,
        centro_costo: it.centro_costo || null,
        uso_especifico: it.uso_especifico || null,
        observacion: it.observacion || null,
        pu_usd: it.pu_usd || null,
        total: it.total || null,
        solicitante: cab.solicitante,
        autorizado_por: cab.autorizado_por || null,
        despachador: cab.despachador || null,
        empresa_area: cab.empresa_area || null,
        tipo_movimiento: 'SALIDA',
      }))
      const { error: err } = await sb.from('salida_almacen').insert(rows)
      if (err) throw err
      onSaved()
    } catch (e: any) {
      const msg = e?.message || e?.details || 'Error al guardar'
      setError(msg)
    } finally {
      setGuardando(false)
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-orange-500/30 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-sm">📤</div>
            <div>
              <h2 className="text-white font-bold text-base">Nueva Salida del Almacén</h2>
              <p className="text-slate-500 text-xs">{items.length === 0 ? 'Agrega materiales antes de despachar' : `${items.length} ítem${items.length > 1 ? 's' : ''} acumulado${items.length > 1 ? 's' : ''}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* ── SECCIÓN 1: Cabecera ── */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos del despacho</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Fecha <span className="text-red-400">*</span></label>
                <input type="date" value={cab.fecha} onChange={e => setCab(c => ({ ...c, fecha: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Almacén <span className="text-red-400">*</span></label>
                <select value={cab.almacen} onChange={e => setCab(c => ({ ...c, almacen: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Unidad Jabalí</option>
                  <option>Managua</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Turno</label>
                <select value={cab.turno} onChange={e => setCab(c => ({ ...c, turno: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>DIA</option>
                  <option>NOCHE</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Empresa / Área</label>
                <input type="text" value={cab.empresa_area} onChange={e => setCab(c => ({ ...c, empresa_area: e.target.value }))}
                  placeholder="Ej: Canchanya Ingenieros"
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Solicitante <span className="text-red-400">*</span></label>
                <SearchableSelect
                  value={cab.solicitante}
                  onChange={val => setCab(c => ({ ...c, solicitante: val }))}
                  options={solicitantes.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-slate-800 focus:!ring-orange-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Autorizado por</label>
                <SearchableSelect
                  value={cab.autorizado_por}
                  onChange={val => setCab(c => ({ ...c, autorizado_por: val }))}
                  options={aprobadores.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-slate-800 focus:!ring-orange-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Despachador</label>
                <SearchableSelect
                  value={cab.despachador}
                  onChange={val => setCab(c => ({ ...c, despachador: val }))}
                  options={despachadores.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-slate-800 focus:!ring-orange-500"
                />
              </div>
            </div>
          </section>

          {/* ── SECCIÓN 2: Agregar material ── */}
          <section className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Agregar material</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 relative">
                <label className="text-xs text-slate-400 mb-1 block">Código material</label>
                <input type="text" value={busqCod} onChange={e => { setBusqCod(e.target.value); setMatSel(null) }}
                  placeholder="Escribir código o descripción…"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                {sugerencias.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {sugerencias.map(m => (
                      <li key={m.id} onClick={() => seleccionarMaterial(m)}
                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0">
                        <p className="text-orange-400 text-xs font-mono">{m.codigo}</p>
                        <p className="text-white text-xs">{m.descripcion}</p>
                        <p className="text-slate-500 text-xs">{m.unidad_medida} · {m.familia}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Descripción</label>
                <input readOnly value={matSel?.descripcion ?? ''}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-400 rounded-lg px-3 py-2 text-sm" placeholder="Auto"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">U.M.</label>
                <input readOnly value={matSel?.unidad_medida ?? ''}
                  className="w-full bg-slate-900/50 border border-slate-700 text-slate-400 rounded-lg px-3 py-2 text-sm" placeholder="Auto"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                  <span>Cantidad <span className="text-red-400">*</span></span>
                  {matSel && <span className="text-orange-400 font-mono text-[10px]">Stock: {stockDisp.toLocaleString('es-NI')}</span>}
                </label>
                <input type="number" min="0" max={stockDisp > 0 ? stockDisp : undefined} step="any" value={cantidad} onChange={e => setCantidad(e.target.value)}
                  placeholder="0"
                  className={`w-full bg-slate-900 border ${cantidad && parseFloat(cantidad) > stockDisp ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-orange-500'} text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
                />
                {cantidad && parseFloat(cantidad) > stockDisp && <p className="text-red-500 text-[10px] mt-1 break-words">Supera stock disponible</p>}
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">P.U. USD (PPP)</label>
                <input readOnly value={puUsd > 0 ? puUsd.toFixed(4) : ''}
                  className="w-full bg-slate-900/50 border border-slate-700 text-orange-400 font-medium rounded-lg px-3 py-2 text-sm cursor-not-allowed" placeholder="Calculado"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Total USD</label>
                <input readOnly value={totalItem > 0 ? totalItem.toFixed(2) : ''}
                  className="w-full bg-slate-900/50 border border-slate-700 text-orange-400 font-medium rounded-lg px-3 py-2 text-sm cursor-not-allowed" placeholder="Automático"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">N° Vale</label>
                <input type="text" value={nroVale} onChange={e => setNroVale(e.target.value)}
                  placeholder="Ej: V-001"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">N° OT</label>
                <input type="text" value={nroOt} onChange={e => setNroOt(e.target.value)}
                  placeholder="Ej: OT-2024-005"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Actividad</label>
                <input type="text" value={actividad} onChange={e => setActividad(e.target.value)}
                  placeholder="Ej: Mantenimiento"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Centro de Costo</label>
                <SearchableSelect
                  value={centroCosto}
                  onChange={val => setCentroCosto(val)}
                  options={centros.map(c => ({ value: c.centro_costo ?? '', label: `${c.cod_ceco} — ${c.centro_costo}` }))}
                  placeholder="-- Seleccionar --"
                  className="!bg-slate-900 focus:!ring-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Uso específico</label>
                <input type="text" value={usoEspecifico} onChange={e => setUsoEspecifico(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Observación</label>
                <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)}
                  placeholder="Opcional"
                  className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={agregarItem} disabled={!puedeAgregar}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Agregar ítem
              </button>
            </div>
          </section>

          {/* ── Tabla ítems acumulados ── */}
          {items.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Materiales a despachar ({items.length})
              </h3>
              <div className="border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-800 border-b border-slate-700">
                      {['Código','Descripción','UM','Cantidad','P.U USD','Total USD','N° Vale','N° OT','C. Costo',''].map(h => (
                        <th key={h} className="text-left text-slate-400 font-semibold uppercase px-3 py-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => (
                      <tr key={it._key} className={`border-b border-slate-800/50 hover:bg-slate-800/30 ${i%2===0?'':'bg-slate-800/10'}`}>
                        <td className="px-3 py-2"><code className="text-orange-400 bg-orange-500/10 px-1 rounded">{it.codigo}</code></td>
                        <td className="px-3 py-2 text-white max-w-xs"><p className="truncate">{it.descripcion}</p></td>
                        <td className="px-3 py-2 text-slate-500">{it.unidad}</td>
                        <td className="px-3 py-2 text-right text-slate-300 font-mono">{it.cantidad.toLocaleString('es-NI')}</td>
                        <td className="px-3 py-2 text-right text-slate-400 font-mono">{it.pu_usd > 0 ? it.pu_usd.toFixed(4) : '—'}</td>
                        <td className="px-3 py-2 text-right text-orange-400 font-medium font-mono">{it.total > 0 ? '$' + it.total.toFixed(2) : '—'}</td>
                        <td className="px-3 py-2 text-slate-400">{it.numero_vale || '—'}</td>
                        <td className="px-3 py-2 text-slate-400">{it.numero_ot || '—'}</td>
                        <td className="px-3 py-2 text-slate-400 max-w-24"><p className="truncate">{it.centro_costo || '—'}</p></td>
                        <td className="px-3 py-2">
                          <button onClick={() => eliminarItem(it._key)} className="text-red-500 hover:text-red-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800/50 border-t border-slate-700">
                      <td colSpan={3} className="px-3 py-2 text-slate-400 font-semibold text-right">Total ítems:</td>
                      <td className="px-3 py-2 text-orange-400 font-bold text-right">
                        {items.reduce((s, i) => s + i.cantidad, 0).toLocaleString('es-NI')} uds.
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-semibold text-right">Total general:</td>
                      <td className="px-3 py-2 text-orange-400 font-bold text-right">
                        ${items.reduce((s, i) => s + i.total, 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                      <td colSpan={3}/>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
          <p className="text-slate-500 text-xs">
            {!cabOk && '⚠ Completa los campos obligatorios (*)'}
            {cabOk && items.length === 0 && '⚠ Agrega al menos un ítem'}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={!cabOk || items.length === 0 || guardando}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {guardando ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Guardando…</>
              ) : (
                <>🚚 Despachar {items.length > 0 ? `(${items.length} ítem${items.length > 1 ? 's' : ''})` : ''}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
