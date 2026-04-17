'use client'
import { useState, useCallback } from 'react'
import { useMateriales } from '@/lib/hooks/useAlmacen'
import type { Material } from '@/types/database'
import { BackButton } from '@/components/ui/BackButton'

const PAGE_SIZE = 50

function getBadgeClass(color: string): string {
  if (color === 'green') return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300 border border-green-700'
  if (color === 'red') return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900 text-red-300 border border-red-700'
  if (color === 'blue') return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900 text-blue-300 border border-blue-700'
  return 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700'
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
            <h1 className="text-xl font-bold text-white">Catalogo de Materiales</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">
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
            placeholder="Buscar por codigo o descripcion..."
            className="flex-1 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Buscar
          </button>
          {(busqueda || familiaFiltro) && (
            <button
              onClick={handleClear}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
        {familias.length > 0 && (
          <select
            value={familiaFiltro}
            onChange={e => { setFamiliaFiltro(e.target.value); setPage(1) }}
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todas las familias</option>
            {familias.sort().map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Codigo</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Descripcion</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Unidad</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Familia</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Subfamilia</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Ubic. Jabali</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-slate-800 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    No se encontraron materiales
                  </td>
                </tr>
              ) : (
                filtered.map((mat: Material) => (
                  <tr key={mat.id} className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-blue-400 text-xs">{mat.codigo}</span>
                    </td>
                    <td className="px-4 py-3 text-white max-w-xs">
                      {mat.descripcion ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{mat.unidad_medida ?? '-'}</td>
                    <td className="px-4 py-3">
                      {mat.familia ? <Badge label={mat.familia} color="blue" /> : <span className="text-slate-600">-</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{mat.subfamilia ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{mat.ubicacion_jabali ?? '-'}</td>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-slate-500 text-sm">
              {'Pagina ' + page + ' de ' + totalPages + ' — ' + count.toLocaleString() + ' registros'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
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
