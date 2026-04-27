'use client'

import { useState, KeyboardEvent } from 'react'
import { useProveedores } from '@/lib/hooks/useAlmacen'
import type { Proveedor } from '@/types/database'
import { BackButton } from '@/components/ui/BackButton'
import ModalProveedor from '@/components/maestros/ModalProveedor'

function getBadgeClass(color: string) {
  const map: Record<string, string> = {
    green: 'bg-green-100 text-green-700 border border-green-200',
    red:   'bg-red-100 text-red-700 border border-red-200',
    blue:  'bg-blue-100 text-blue-700 border border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
  }
  return map[color] ?? map.slate
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getBadgeClass(color)}`}>
      {label}
    </span>
  )
}

export default function Page() {
  const [input, setInput] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroPais, setFiltroPais] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const { data, count, totalPages, loading, refetch } = useProveedores(busqueda, page, 50)

  const paises = Array.from(new Set(data.map((p: Proveedor) => p.pais).filter(Boolean))).sort() as string[]

  const filtered = filtroPais
    ? data.filter((p: Proveedor) => p.pais === filtroPais)
    : data

  function buscar() {
    setBusqueda(input.trim())
    setFiltroPais('')
    setPage(1)
  }

  function limpiar() {
    setInput('')
    setBusqueda('')
    setFiltroPais('')
    setPage(1)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') buscar()
  }

  const hayFiltros = busqueda || filtroPais

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-brand-black">Proveedores</h1>
          </div>
          <p className="text-brand-gray text-sm mt-0.5">
            {loading ? 'Cargando...' : `${count.toLocaleString('es-NI')} registros`}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 active:scale-95 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          + Nuevo Proveedor
        </button>
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
              placeholder="Buscar proveedor, RUC, ciudad..."
              className="w-full bg-brand-light border border-slate-200 text-brand-black placeholder-brand-gray/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            />
          </div>
          <select
            value={filtroPais}
            onChange={e => { setFiltroPais(e.target.value); setPage(1) }}
            className="bg-brand-light border border-slate-200 text-brand-black rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all min-w-[160px]"
          >
            <option value="">Todos los países</option>
            {paises.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
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
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">RUC / DI</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Proveedor</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Cod. Sysman</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Ciudad</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">País</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">IVA</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Forma Pago</th>
                <th className="text-left py-3 px-4 text-xs font-bold text-brand-gray uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-brand-gray">
                    No se encontraron proveedores
                  </td>
                </tr>
              ) : (
                filtered.map((p: Proveedor, i: number) => (
                  <tr key={p.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="py-3 px-4 text-brand-gray font-mono text-xs">{p.ruc_di ?? '—'}</td>
                    <td className="py-3 px-4 text-brand-black font-semibold">{p.proveedor}</td>
                    <td className="py-3 px-4 text-brand-gray text-xs">{p.cod_sysman ?? '—'}</td>
                    <td className="py-3 px-4 text-brand-gray">{p.ciudad ?? '—'}</td>
                    <td className="py-3 px-4">
                      {p.pais ? <Badge label={p.pais} color="blue" /> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge label={p.iva ?? 'NO'} color={p.iva === 'SI' ? 'green' : 'slate'} />
                    </td>
                    <td className="py-3 px-4 text-brand-gray text-xs">{p.forma_pago ?? '—'}</td>
                    <td className="py-3 px-4">
                      <Badge
                        label={p.activo ? 'Activo' : 'Inactivo'}
                        color={p.activo ? 'green' : 'red'}
                      />
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

      {showModal && (
        <ModalProveedor
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
