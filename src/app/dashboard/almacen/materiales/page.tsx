'use client'
import { useState, useCallback } from 'react'
import { useMateriales } from '@/lib/hooks/useAlmacen'
import type { Material } from '@/types/database'
import { BackButton } from '@/components/ui/BackButton'

const PAGE_SIZE = 50

function getBadgeClass(color: string): string {
  if (color === 'green') return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200'
  if (color === 'red') return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200'
  if (color === 'blue') return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-50 text-brand-black border border-slate-200'
  return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-brand-gray border border-slate-200'
}

function Badge({ label, color = 'slate' }: { label: string; color?: string }) {
  return <span className={getBadgeClass(color)}>{label}</span>
}

export default function Page() {
  const [busqueda, setBusqueda] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [page, setPage] = useState(1)
  const [familiaFiltro, setFamiliaFiltro] = useState('')

  const { data, count, totalPages, loading } = useMateriales(busqueda, page, PAGE_SIZE)

  const handleSearch = useCallback(() => {
    setBusqueda(inputVal)
    setPage(1)
    setFamiliaFiltro('')
  }, [inputVal])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleClear = () => {
    setInputVal('')
    setBusqueda('')
    setPage(1)
    setFamiliaFiltro('')
  }

  const familias = Array.from(new Set(data.map((m: Material) => m.familia).filter(Boolean))) as string[]
  const filtered = familiaFiltro ? data.filter((m: Material) => m.familia === familiaFiltro) : data

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-brand-black">Catálogo de Materiales</h1>
          </div>
          <p className="text-brand-gray text-sm mt-1">
            {loading ? 'Cargando...' : count.toLocaleString() + ' materiales registrados'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[280px] flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar por código o descripción..."
            className="flex-1 bg-brand-light border border-slate-200 text-brand-black placeholder-brand-gray/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
          />
          <button
            onClick={handleSearch}
            className="bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand-red/20 transition-all hover:shadow-brand-red/30 active:scale-95"
          >
            Buscar
          </button>
          {(busqueda || familiaFiltro) && (
            <button
              onClick={handleClear}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-brand-gray hover:text-brand-black px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
        {familias.length > 0 && (
          <select
            value={familiaFiltro}
            onChange={e => { setFamiliaFiltro(e.target.value); setPage(1) }}
            className="bg-white border border-slate-200 text-brand-black rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"
          >
            <option value="">Todas las familias</option>
            {familias.sort().map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Código</th>
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Descripción</th>
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Unidad</th>
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Familia</th>
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Subfamilia</th>
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Ubic. Jabalí</th>
                <th className="text-left px-4 py-3.5 text-brand-gray font-bold uppercase tracking-wider text-xs">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-brand-gray font-semibold">
                    No se encontraron materiales
                  </td>
                </tr>
              ) : (
                filtered.map((mat: Material, i: number) => (
                  <tr key={mat.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-4 py-3">
                      <code className="text-brand-black font-semibold text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{mat.codigo}</code>
                    </td>
                    <td className="px-4 py-3 text-brand-black font-medium max-w-xs">
                      {mat.descripcion ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-brand-gray text-xs">{mat.unidad_medida ?? '-'}</td>
                    <td className="px-4 py-3">
                      {mat.familia ? <Badge label={mat.familia} color="blue" /> : <span className="text-brand-gray">-</span>}
                    </td>
                    <td className="px-4 py-3 text-brand-gray text-xs">{mat.subfamilia ?? '-'}</td>
                    <td className="px-4 py-3 text-brand-gray text-xs">{mat.ubicacion_jabali ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge label={mat.activo === 'SI' ? 'Activo' : 'Inactivo'} color={mat.activo === 'SI' ? 'green' : 'red'} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <span className="text-brand-gray font-medium text-xs">
              {'Página ' + page + ' de ' + totalPages + ' — ' + count.toLocaleString() + ' registros'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-brand-gray hover:text-brand-black hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-200 text-brand-gray hover:text-brand-black hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
