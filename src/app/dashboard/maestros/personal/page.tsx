'use client'

import { useState, KeyboardEvent } from 'react'
import Link from 'next/link'
import { usePersonal } from '@/lib/hooks/useAlmacen'
import type { Personal } from '@/types/database'
import { BackButton } from '@/components/ui/BackButton'

export default function Page() {
  const [input, setInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)

  const { data, count, totalPages, loading } = usePersonal(busqueda, page, 50)

  function buscar() {
    setBusqueda(input.trim())
    setPage(1)
  }

  function limpiar() {
    setInput('')
    setBusqueda('')
    setPage(1)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') buscar()
  }

  const hayFiltros = busqueda.length > 0

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-brand-black">Personal</h1>
          </div>
          <p className="text-brand-gray text-sm mt-0.5">
            {loading ? 'Cargando...' : `${count.toLocaleString('es-NI')} trabajadores registrados`}
          </p>
        </div>
        <Link
          href="/dashboard/personal/nuevo"
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 active:scale-95 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          + Nuevo Personal
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[280px]">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Buscar por código, nombre o cargo..."
              className="w-full bg-brand-light border border-slate-200 text-brand-black placeholder-brand-gray/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            />
          </div>
          <button
            onClick={buscar}
            className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-sm px-4 py-2 rounded-xl font-bold transition-all"
          >
            Buscar
          </button>
          {hayFiltros && (
            <button
              onClick={limpiar}
              className="bg-slate-200 hover:bg-slate-300 text-brand-black text-sm px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Código</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Trabajador</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Ocupación / Cargo</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">CeCo Asignado</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Planilla</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Régimen</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-brand-gray">
                    No se encontró personal registrado
                  </td>
                </tr>
              ) : (
                data.map((p: Personal, i: number) => (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="py-3 px-4 text-brand-gray font-mono text-xs">{p.codigo ?? '—'}</td>
                    <td className="py-3 px-4 text-brand-black font-semibold">{p.trabajador}</td>
                    <td className="py-3 px-4 text-brand-gray text-xs">{p.ocupacion ?? '—'}</td>
                    <td className="py-3 px-4 text-brand-gray text-xs">
                      {p.ceco ? <span className="font-bold">{p.ceco}</span> : '—'}
                    </td>
                    <td className="py-3 px-4 text-brand-gray text-xs">{p.tipo_planilla ?? '—'}</td>
                    <td className="py-3 px-4 text-brand-gray text-xs">{p.tipo_regimen ?? '—'}</td>
                    <td className="py-3 px-4">
                      {p.activo === 'SI' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">Activo</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">Inactivo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <span className="text-brand-gray text-sm font-medium">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-brand-black hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-slate-200 text-brand-black hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
