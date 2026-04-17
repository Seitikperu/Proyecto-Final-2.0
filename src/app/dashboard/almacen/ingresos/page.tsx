'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import ModalIngreso from '@/components/almacen/ModalIngreso'
import { showToast } from '@/components/ui/Toast'
import type { IngresoAlmacen } from '@/types/database'
import { BackButton } from '@/components/ui/BackButton'

const sb = getSupabaseClient()

const fmtUSD   = (n: number | null) => n == null ? '—' : '$' + n.toLocaleString('es-NI', { minimumFractionDigits: 2 })
const fmtFecha = (s: string | null) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function IngresosPage() {
  const [rows,       setRows]       = useState<IngresoAlmacen[]>([])
  const [count,      setCount]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [page,       setPage]       = useState(1)
  const [busqueda,   setBusqueda]   = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [realtime,   setRealtime]   = useState(false)
  const PAGE_SIZE = 25

  // ── Carga de datos vía Supabase ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let q = sb
        .from('ingreso_almacen')
        .select('*', { count: 'exact' })
        .order('fecha', { ascending: false })
        .order('id',    { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (busqueda)   q = q.or(`codigo.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%,proveedor.ilike.%${busqueda}%`)
      if (fechaDesde) q = q.gte('fecha', fechaDesde)
      if (fechaHasta) q = q.lte('fecha', fechaHasta)

      const { data, count: total, error } = await q
      if (error) throw error
      setRows((data ?? []) as IngresoAlmacen[])
      setCount(total ?? 0)
    } catch (err) {
      showToast('error', 'Error al cargar datos', err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [page, busqueda, fechaDesde, fechaHasta])

  // ── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => { fetchData() }, [fetchData])

  // ── Supabase Realtime — suscripción a ingreso_almacen ───────────────────
  useEffect(() => {
    const channel = sb
      .channel('ingresos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ingreso_almacen' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Si estamos en la primera página, agregamos al inicio de la lista
            if (page === 1) {
              setRows(prev => [payload.new as IngresoAlmacen, ...prev].slice(0, PAGE_SIZE))
              setCount(c => c + 1)
            }
          }
          if (payload.eventType === 'DELETE') {
            setRows(prev => prev.filter(r => r.id !== (payload.old as IngresoAlmacen).id))
            setCount(c => Math.max(0, c - 1))
          }
          if (payload.eventType === 'UPDATE') {
            setRows(prev => prev.map(r => r.id === (payload.new as IngresoAlmacen).id ? payload.new as IngresoAlmacen : r))
          }
        }
      )
      .subscribe((status) => {
        setRealtime(status === 'SUBSCRIBED')
      })

    return () => { sb.removeChannel(channel) }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  // ── Debounce en búsqueda ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400)
    return () => clearTimeout(t)
  }, [busqueda, fechaDesde, fechaHasta])

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">

      {/* ── Cabecera ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-bold text-white">Ingresos al Almacén</h1>
          </div>
            {/* Indicador Realtime */}
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
              realtime
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${realtime ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}/>
              {realtime ? 'Tiempo real activo' : 'Conectando…'}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading ? 'Cargando…' : `${count.toLocaleString('es-NI')} registros`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          + Nuevo Ingreso
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Buscar código, descripción, proveedor…"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="lg:col-span-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        {(busqueda || fechaDesde || fechaHasta) && (
          <button onClick={() => { setBusqueda(''); setFechaDesde(''); setFechaHasta(''); setPage(1) }}
            className="mt-2 text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ── Tabla ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Fecha','Código','Descripción','Proveedor','Cantidad','Unidad','P.U. USD','Total USD','Familia'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }}/>
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                  ? (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                          </svg>
                          <p className="text-slate-500 text-sm">No se encontraron registros</p>
                          {(busqueda || fechaDesde || fechaHasta) && (
                            <p className="text-slate-600 text-xs">Prueba ajustando los filtros</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                  : rows.map((row, i) => (
                    <tr key={row.id} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-800/10'}`}>
                      <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap text-xs">{fmtFecha(row.fecha)}</td>
                      <td className="px-4 py-2.5">
                        <code className="text-blue-400 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">{row.codigo ?? '—'}</code>
                      </td>
                      <td className="px-4 py-2.5 text-white max-w-xs">
                        <p className="truncate text-sm">{row.descripcion ?? '—'}</p>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 text-xs whitespace-nowrap">{row.proveedor ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-300 text-right font-mono">{row.cantidad?.toLocaleString('es-NI') ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{row.unidad ?? '—'}</td>
                      <td className="px-4 py-2.5 text-slate-300 text-right whitespace-nowrap">{fmtUSD(row.pu_usd)}</td>
                      <td className="px-4 py-2.5 text-green-400 font-semibold text-right whitespace-nowrap">{fmtUSD(row.total)}</td>
                      <td className="px-4 py-2.5 text-xs">
                        <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded truncate inline-block max-w-24">{row.familia ?? '—'}</span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-slate-400 text-xs">
              Página {page} de {totalPages} — {count.toLocaleString('es-NI')} registros
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors">
                ← Anterior
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm text-slate-400 hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors">
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Nuevo Ingreso ── */}
      {showModal && (
        <ModalIngreso
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            // Realtime actualiza la tabla automáticamente;
            // si el usuario está en página > 1, volvemos a la 1
            if (page !== 1) setPage(1)
            showToast('success', '¡Ingreso registrado!', 'Los datos se guardaron correctamente en Supabase.')
          }}
        />
      )}
    </div>
  )
}
