'use client'
import { useState } from 'react'
import { useSalidas } from '@/lib/hooks/useAlmacen'
import ModalSalida from '@/components/almacen/ModalSalida'
import type { AlmacenFilter } from '@/types/database'
import { BackButton } from '@/components/ui/BackButton'

const fmtFecha = (s: string | null) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function SalidasPage() {
  const [filter, setFilter] = useState<AlmacenFilter>({})
  const [page, setPage] = useState(1)
  const { data, count, totalPages, loading } = useSalidas(filter, page, 25)
  const [showModal, setShowModal] = useState(false)

  // refetch manual cambiando filtro + page para forzar re-render
  const refetch = () => setPage(p => { const same = p; setFilter(f => ({ ...f })); return same })

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-brand-black">Salidas del Almacén</h1>
          </div>
          <p className="text-brand-gray text-sm mt-0.5">{loading ? 'Cargando...' : count.toLocaleString('es-NI') + ' registros'}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Nueva Salida
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input type="text" placeholder="Buscar código, descripción, solicitante..."
            className="lg:col-span-2 bg-brand-light border border-slate-200 text-brand-black placeholder-brand-gray/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            onChange={e => { setFilter(f => ({ ...f, busqueda: e.target.value || undefined })); setPage(1) }}/>
          <input type="date" className="bg-brand-light border border-slate-200 text-brand-black rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            onChange={e => { setFilter(f => ({ ...f, fecha_desde: e.target.value || undefined })); setPage(1) }}/>
          <input type="date" className="bg-brand-light border border-slate-200 text-brand-black rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            onChange={e => { setFilter(f => ({ ...f, fecha_hasta: e.target.value || undefined })); setPage(1) }}/>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Fecha','Código','Descripción','Solicitante','Cant.','UM','N° Vale','N° OT','Centro Costo','Autorizado por'].map(h => (
                  <th key={h} className="text-left text-xs font-bold text-brand-gray uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => (
                <tr key={i} className="border-b border-slate-100">
                  {Array.from({length:10}).map((_,j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"/></td>
                  ))}
                </tr>
              )) : data.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-brand-gray font-semibold py-12">No se encontraron registros</td></tr>
              ) : data.map((row, i) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i%2===0?'bg-white':'bg-slate-50/50'}`}>
                  <td className="px-4 py-3 text-brand-gray whitespace-nowrap text-xs">{fmtFecha(row.fecha)}</td>
                  <td className="px-4 py-3"><code className="text-brand-black font-semibold text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{row.codigo ?? '—'}</code></td>
                  <td className="px-4 py-3 text-brand-black font-medium max-w-xs"><p className="truncate">{row.descripcion ?? '—'}</p></td>
                  <td className="px-4 py-3 text-brand-gray text-xs whitespace-nowrap">{row.solicitante ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-black font-semibold text-right font-mono">{row.cantidad?.toLocaleString('es-NI') ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-gray text-xs">{row.unidad_medida ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-gray text-xs">{row.numero_vale ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-gray text-xs">{row.numero_ot ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="bg-slate-100 border border-slate-200 text-brand-gray font-medium px-2 py-0.5 rounded truncate inline-block max-w-28">{row.centro_costo ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-gray text-xs whitespace-nowrap">{row.autorizado_por ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <p className="text-brand-gray text-xs font-medium">Página {page} de {totalPages} — {count.toLocaleString('es-NI')} registros</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="px-3 py-1.5 text-sm font-medium text-brand-gray hover:text-brand-black disabled:opacity-30 rounded-lg hover:bg-slate-200 transition-colors">← Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="px-3 py-1.5 text-sm font-medium text-brand-gray hover:text-brand-black disabled:opacity-30 rounded-lg hover:bg-slate-200 transition-colors">Siguiente →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ModalSalida
          onClose={() => setShowModal(false)}
          onSaved={() => { refetch(); setShowModal(false) }}
        />
      )}
    </div>
  )
}
