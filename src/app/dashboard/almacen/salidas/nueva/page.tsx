'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { BackButton } from '@/components/ui/BackButton'
import type { Material, CentroCosto } from '@/types/database'

const sb = getSupabaseClient()

// ── Tipos ─────────────────────────────────────────────────────────────
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
  numero_vale: string
  numero_ot: string
}

const today = () => new Date().toISOString().slice(0, 10)

export default function NuevaSalidaPage() {
  // ── Cabecera ──
  const [cab, setCab] = useState<Cabecera>({
    fecha: today(), almacen: 'Unidad Jabalí', turno: 'DIA',
    solicitante: '', autorizado_por: '', despachador: '', empresa_area: '',
    numero_vale: '', numero_ot: ''
  })

  // ── Ítem actual ──
  const [busqCod, setBusqCod] = useState('')
  const [sugerencias, setSugerencias] = useState<Material[]>([])
  const [matSel, setMatSel] = useState<Material | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [actividad, setActividad] = useState('')
  const [centroCosto, setCentroCosto] = useState('')
  const [usoEspecifico, setUsoEspecifico] = useState('')
  const [observacion, setObservacion] = useState('')
  const [puUsd, setPuUsd] = useState(0)
  const [stockDisp, setStockDisp] = useState(0)

  // ── Lista acumulada ──
  const [items, setItems] = useState<ItemSalida[]>([])
  const keyRef = useRef(0)

  // ── Catálogos ──
  const [solicitantes, setSolicitantes] = useState<{ trabajador: string }[]>([])
  const [despachadores, setDespachadores] = useState<{ trabajador: string }[]>([])
  const [aprobadores, setAprobadores] = useState<{ trabajador: string }[]>([])
  const [centros, setCentros] = useState<CentroCosto[]>([])

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Cargar catálogos ──
  useEffect(() => {
    sb.from('personal').select('trabajador').order('trabajador').limit(800)
      .then(({ data }) => setSolicitantes(data ?? []))

    sb.from('personal').select('trabajador').eq('Acceso_Almacen', 'SI').order('trabajador').limit(500)
      .then(({ data }) => setDespachadores(data ?? []))

    sb.from('personal').select('trabajador').eq('autorizacion_salm', 'SI').order('trabajador').limit(500)
      .then(({ data }) => setAprobadores(data ?? []))

    sb.from('centros_costo').select('id,cod_ceco,centro_costo,area').eq('filtro_almacen', 'SI').order('cod_ceco').limit(500)
      .then(({ data }) => setCentros((data ?? []) as CentroCosto[]))
  }, [])

  // ── Búsqueda de material ──
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
    // Obtener stock y PPP
    const { data } = await sb.rpc('get_stock_and_pu', { p_codigo: m.codigo })
    if (data) {
      setPuUsd(Number((data as any).pu_usd || 0))
      setStockDisp(Number((data as any).stock || 0))
    }
  }

  // ── Agregar ítem ──
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
      numero_vale: cab.numero_vale,
      numero_ot: cab.numero_ot,
      actividad,
      centro_costo: centroCosto,
      uso_especifico: usoEspecifico,
      observacion,
      pu_usd: puUsd,
      total: totalItem,
    }])
    setBusqCod(''); setMatSel(null); setCantidad('')
    setPuUsd(0); setStockDisp(0)
  }

  const eliminarItem = (key: number) => setItems(prev => prev.filter(i => i._key !== key))

  // ── Guardado ──
  const cabOk = cab.fecha && cab.almacen && cab.solicitante

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
      
      showToast('success', '¡Salida registrada!', 'Los datos se guardaron correctamente en BD.')
      
      // Limpiamos los items y algunos datos de la cabecera para un nuevo despacho sin redireccionar
      setItems([])
      setCab(c => ({
        ...c,
        numero_vale: '',
        numero_ot: '',
      }))
      setObservacion('')
      setActividad('')
      setCentroCosto('')
      setUsoEspecifico('')

    } catch (e: any) {
      const msg = e?.message || e?.details || 'Error al guardar'
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
            <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">Salida de Almacén</h1>
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
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">TURNO</label>
              <select value={cab.turno} onChange={e => setCab(c => ({ ...c, turno: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all">
                <option>DIA</option>
                <option>NOCHE</option>
              </select>
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
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">N° VALE</label>
              <input type="text" value={cab.numero_vale} onChange={e => setCab(c => ({ ...c, numero_vale: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">N° OT</label>
              <input type="text" value={cab.numero_ot} onChange={e => setCab(c => ({ ...c, numero_ot: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">SOLICITANTE <span className="text-brand-red">*</span></label>
              <SearchableSelect
                value={cab.solicitante}
                onChange={val => setCab(c => ({ ...c, solicitante: val }))}
                options={solicitantes.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                placeholder="-- Buscar --"
                className="!bg-slate-50 !border-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">AUTORIZA</label>
              <SearchableSelect
                value={cab.autorizado_por}
                onChange={val => setCab(c => ({ ...c, autorizado_por: val }))}
                options={aprobadores.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                placeholder="-- Seleccionar --"
                className="!bg-slate-50 !border-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">DESPACHA</label>
              <SearchableSelect
                value={cab.despachador}
                onChange={val => setCab(c => ({ ...c, despachador: val }))}
                options={despachadores.map(p => ({ value: p.trabajador, label: p.trabajador }))}
                placeholder="-- Seleccionar --"
                className="!bg-slate-50 !border-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">EMPRESA / ÁREA</label>
              <input type="text" value={cab.empresa_area} onChange={e => setCab(c => ({ ...c, empresa_area: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Fila 3 - Actividad / CC / Uso */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">ACTIVIDAD DE SALIDA</label>
              <input type="text" value={actividad} onChange={e => setActividad(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">CENTRO DE COSTO</label>
              <SearchableSelect
                value={centroCosto}
                onChange={val => setCentroCosto(val)}
                options={centros.map(c => ({ value: c.centro_costo ?? '', label: `${c.cod_ceco} — ${c.centro_costo}` }))}
                placeholder="-- Seleccionar --"
                className="!bg-white !border-slate-300"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">USO ESPECÍFICO</label>
              <input type="text" value={usoEspecifico} onChange={e => setUsoEspecifico(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
            </div>
          </div>

          {/* Fila 4 - Material y Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 relative">
            <div className="relative md:col-span-2">
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
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">CANT <span className="text-brand-red">*</span></label>
              <input type="number" min="0" step="any" value={cantidad} onChange={e => setCantidad(e.target.value)}
                className={`w-full bg-white border ${cantidad && parseFloat(cantidad) > stockDisp ? 'border-red-500 focus:ring-red-500 text-red-600 bg-red-50' : 'border-slate-300 focus:ring-brand-red text-brand-black'} rounded-lg px-3 py-1.5 text-sm transition-all`} />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">PRECIO</label>
              <input readOnly value={puUsd > 0 ? puUsd.toFixed(4) : ''}
                className="w-full bg-slate-100 border border-slate-200 text-brand-gray rounded-lg px-3 py-1.5 text-sm font-medium" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">TOTAL</label>
              <input readOnly value={totalItem > 0 ? totalItem.toFixed(2) : ''}
                className="w-full bg-slate-100 border border-slate-200 text-green-700 font-bold rounded-lg px-3 py-1.5 text-sm" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">UBICACIÓN</label>
              <input readOnly value={matSel?.ubicacion_jabali ?? ''}
                className="w-full bg-slate-100 border border-slate-200 text-brand-gray rounded-lg px-3 py-1.5 text-sm font-medium" />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">STOCK</label>
              <input readOnly value={stockDisp}
                className="w-full bg-brand-black border border-slate-700 text-brand-red font-mono font-bold rounded-lg px-3 py-1.5 text-sm text-center" />
            </div>
            <div className="md:col-span-4">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">MATERIAL</label>
              <div className="w-full bg-brand-black border border-slate-700 text-white rounded-lg px-3 py-1.5 text-sm font-semibold min-h-[34px] flex items-center">
                {matSel?.descripcion || <span className="text-slate-500 italic">Auto-completado</span>}
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">UM</label>
              <input readOnly value={matSel?.unidad_medida ?? ''}
                className="w-full bg-slate-100 border border-slate-200 text-brand-gray rounded-lg px-3 py-1.5 text-sm font-medium" />
            </div>
          </div>

          {/* Fila 5 - Botones y Obs */}
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full relative">
              <label className="text-[10px] font-bold text-brand-gray uppercase tracking-widest block mb-1">OBSERVACIÓN</label>
              <input type="text" value={observacion} onChange={e => setObservacion(e.target.value)}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all" />
              {cantidad && parseFloat(cantidad) > stockDisp && <p className="text-red-500 text-[10px] mt-1 absolute -bottom-5 font-bold">⚠ Cantidad supera el stock actual disponible</p>}
            </div>
            
            <div className="flex gap-3">
              <button onClick={agregarItem} disabled={!puedeAgregar}
                className="bg-white border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white font-extrabold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:border-slate-300 disabled:text-slate-400 disabled:hover:bg-white tracking-widest text-sm">
                AGREGAR
              </button>
              
              <button onClick={guardar} disabled={!cabOk || items.length === 0 || guardando}
                className="bg-brand-black text-white hover:bg-slate-800 font-extrabold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:bg-slate-300 tracking-widest text-sm flex items-center gap-2">
                {guardando ? 'GUARDANDO...' : 'DESPACHAR'}
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
                {['FECHA/TURNO','SOLICITANTE','MATERIAL','CANTIDAD | PRECIO','TOTAL','ACTIVIDAD','CENTRO COSTO','N° OT','N° VALE','OBSERVACIÓN','BORRAR'].map(h => (
                  <th key={h} className="text-left font-bold tracking-wider px-3 py-2 whitespace-nowrap border-r border-slate-700 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-10 text-brand-gray font-medium">No se han agregado materiales.</td></tr>
              ) : items.map((it, i) => (
                <tr key={it._key} className={`border-b border-slate-200 ${i%2===0?'bg-white':'bg-slate-50'}`}>
                  <td className="px-3 py-2 whitespace-nowrap">{cab.fecha} - {cab.turno}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[100px] truncate" title={cab.solicitante}>{cab.solicitante}</td>
                  <td className="px-3 py-2 font-medium max-w-[150px] truncate" title={it.descripcion}>
                    <span className="font-bold text-brand-black mr-1">{it.codigo}</span>{it.descripcion} ({it.unidad})
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <span className="font-bold text-brand-black">{it.cantidad}</span> <span className="text-brand-gray mx-1">|</span> {it.pu_usd ? it.pu_usd.toFixed(4) : '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-green-700 font-bold">{it.total ? it.total.toFixed(2) : '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.actividad || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.centro_costo || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.numero_ot || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{it.numero_vale || '-'}</td>
                  <td className="px-3 py-2 max-w-[100px] truncate" title={it.observacion}>{it.observacion || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => eliminarItem(it._key)} className="text-brand-red font-bold hover:text-red-700">X</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={4} className="px-3 py-2 text-right font-bold text-brand-gray uppercase tracking-widest">Total general:</td>
                  <td className="px-3 py-2 text-right text-green-700 font-extrabold">${items.reduce((acc, curr) => acc + curr.total, 0).toFixed(2)}</td>
                  <td colSpan={6}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

      </div>
    </div>
  )
}
