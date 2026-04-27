'use client'
import { useState } from 'react'
import { useStockRealtime } from '@/lib/hooks/useAlmacen'
import { BackButton } from '@/components/ui/BackButton'

const fmtNum = (n: number) => n.toLocaleString('es-NI', { minimumFractionDigits: 0 })
const fmtFecha = (s: string | null) => s ? new Date(s + 'T00:00:00').toLocaleDateString('es-NI', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function StockBadge({ value }: { value: number }) {
  if (value <= 0) return <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">Sin stock</span>
  if (value < 10)  return <span className="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold">⚠ Bajo</span>
  return <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">OK</span>
}

export default function StockPage() {
  const [almacen, setAlmacen] = useState<string | undefined>(undefined)
  const [busqueda, setBusqueda] = useState('')
  const [familia, setFamilia] = useState('')
  const { stock, loading, lastUpdate } = useStockRealtime(almacen)

  // Filtros locales (rápidos, no requieren re-fetch)
  const familias = [...new Set(stock.map(s => s.familia).filter(Boolean))].sort()
  const stockFiltrado = stock
    .filter(s => !busqueda || s.codigo.toLowerCase().includes(busqueda.toLowerCase()) || s.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    .filter(s => !familia || s.familia === familia)

  const sinStock = stockFiltrado.filter(s => s.stock_disponible <= 0).length
  const bajStock = stockFiltrado.filter(s => s.stock_disponible > 0 && s.stock_disponible < 10).length
  const okStock  = stockFiltrado.filter(s => s.stock_disponible >= 10).length

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-brand-black flex items-center gap-2">
            Reporte de Stock
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
              Tiempo real
            </span>
          </h1>
          </div>
          <p className="text-brand-gray text-xs mt-1">
            {lastUpdate
              ? `Última actualización: ${lastUpdate.toLocaleTimeString('es-NI')} — ${loading ? 'actualizando…' : stockFiltrado.length + ' materiales'}`
              : 'Conectando…'}
          </p>
        </div>
        <select
          className="bg-white border border-slate-200 text-brand-black font-semibold text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"
          value={almacen ?? ''}
          onChange={e => setAlmacen(e.target.value || undefined)}>
          <option value="">Todos los almacenes</option>
          <option value="ALM_01">Unidad Jabalí</option>
          <option value="ALM_MANAGUA">Managua</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{loading ? '—' : fmtNum(okStock)}</p>
          <p className="text-xs font-semibold text-brand-gray mt-1 uppercase tracking-wider">Stock OK (≥10)</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{loading ? '—' : fmtNum(bajStock)}</p>
          <p className="text-xs font-semibold text-brand-gray mt-1 uppercase tracking-wider">Stock bajo (&lt;10)</p>
        </div>
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{loading ? '—' : fmtNum(sinStock)}</p>
          <p className="text-xs font-semibold text-brand-gray mt-1 uppercase tracking-wider">Sin stock</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Buscar código o descripción…"
            className="sm:col-span-2 bg-brand-light border border-slate-200 text-brand-black placeholder-brand-gray/60 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}/>
          <select
            className="bg-brand-light border border-slate-200 text-brand-black rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
            value={familia}
            onChange={e => setFamilia(e.target.value)}>
            <option value="">Todas las familias</option>
            {familias.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Código','Descripción','UM','Familia','Ingresado','Salido','Stock Disponible','Ult. Ingreso','Ult. Salida','Estado'].map(h => (
                  <th key={h} className="text-left text-xs font-bold text-brand-gray uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length: 10}).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({length: 10}).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 rounded animate-pulse w-3/4"/></td>
                    ))}
                  </tr>
                ))
              ) : stockFiltrado.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-14">
                    <p className="text-brand-gray font-semibold">No hay materiales</p>
                    <p className="text-brand-gray/60 text-xs mt-1">Los datos se actualizan automáticamente</p>
                  </td>
                </tr>
              ) : (
                stockFiltrado.map((row, i) => (
                  <tr key={row.codigo} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i%2===0?'bg-white':'bg-slate-50/50'}`}>
                    <td className="px-4 py-3">
                      <code className="text-brand-black font-semibold text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">{row.codigo}</code>
                    </td>
                    <td className="px-4 py-3 text-brand-black font-medium max-w-xs"><p className="truncate text-xs">{row.descripcion}</p></td>
                    <td className="px-4 py-3 text-brand-gray text-xs">{row.unidad}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="bg-slate-100 border border-slate-200 text-brand-gray font-medium px-2 py-0.5 rounded truncate inline-block max-w-24">{row.familia}</span>
                    </td>
                    <td className="px-4 py-3 text-green-600 font-semibold text-right font-mono text-xs">{fmtNum(row.total_ingresado)}</td>
                    <td className="px-4 py-3 text-red-600 font-semibold text-right font-mono text-xs">{fmtNum(row.total_salido)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-extrabold font-mono text-sm ${row.stock_disponible <= 0 ? 'text-red-600' : row.stock_disponible < 10 ? 'text-yellow-600' : 'text-brand-black'}`}>
                        {fmtNum(row.stock_disponible)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-gray text-xs whitespace-nowrap">{fmtFecha(row.ultimo_ingreso)}</td>
                    <td className="px-4 py-3 text-brand-gray text-xs whitespace-nowrap">{fmtFecha(row.ultima_salida)}</td>
                    <td className="px-4 py-3"><StockBadge value={row.stock_disponible}/></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && stockFiltrado.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <p className="text-brand-gray font-medium text-xs">{stockFiltrado.length} materiales — calculado en tiempo real</p>
            <p className="text-brand-gray font-medium text-xs">
              Total ingresado: <span className="text-green-600 font-bold">{fmtNum(stockFiltrado.reduce((s,r) => s + r.total_ingresado, 0))}</span>
              &nbsp;·&nbsp;
              Total salido: <span className="text-red-600 font-bold">{fmtNum(stockFiltrado.reduce((s,r) => s + r.total_salido, 0))}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
