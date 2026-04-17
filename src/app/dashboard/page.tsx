'use client'
import { useKPIAlmacen, useFamiliaStats } from '@/lib/hooks/useAlmacen'

const fmtUSD = (n: number) => new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const fmtNum = (n: number) => new Intl.NumberFormat('es-NI').format(n)

const STATUS = [
  { t: 'ingreso_almacen',  n: '18,746', s: 'completo',  p: 100 },
  { t: 'centros_costo',    n: '259',    s: 'parcial',   p: 22 },
  { t: 'maestro_equipos',  n: '69',     s: 'completo',  p: 100 },
  { t: 'actividad',        n: '74',     s: 'completo',  p: 100 },
  { t: 'mlabor',           n: '30',     s: 'parcial',   p: 4 },
  { t: 'salida_almacen',   n: '0',      s: 'pendiente', p: 0 },
  { t: 'cproyecto',        n: '0',      s: 'pendiente', p: 0 },
  { t: 'materiales',       n: '0',      s: 'pendiente', p: 0 },
]

export default function DashboardPage() {
  const { data: kpi, loading: kl } = useKPIAlmacen()
  const { data: familias, loading: fl } = useFamiliaStats(6)
  const max = familias.length ? Math.max(...familias.map(d => d.valor)) : 1

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sistema de Gestión — Unidad Minera Jabalí</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
          Supabase conectado
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total ingresos',       value: kl ? '—' : fmtNum(kpi?.total ?? 0),       sub: 'registros históricos' },
          { label: 'Valor total',          value: kl ? '—' : fmtUSD(kpi?.valor ?? 0),        sub: 'almacén principal' },
          { label: 'Materiales',           value: kl ? '—' : fmtNum(kpi?.materiales ?? 0),   sub: 'códigos únicos' },
          { label: 'Proveedores',          value: kl ? '—' : fmtNum(kpi?.proveedores ?? 0),  sub: 'registros únicos' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm mb-2">{label}</p>
            <p className="text-white text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-slate-500 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-5">Top familias por valor (USD)</h2>
          {fl ? <p className="text-slate-500 text-sm">Cargando...</p> : (
            <div className="space-y-3">
              {familias.map((d, i) => (
                <div key={d.familia} className="flex items-center gap-3">
                  <p className="text-slate-400 text-xs w-44 truncate flex-shrink-0">{d.familia}</p>
                  <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(d.valor / max) * 100}%` }}/>
                  </div>
                  <p className="text-white text-xs w-20 text-right flex-shrink-0">{fmtUSD(d.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Estado de carga de datos</h2>
          <div className="space-y-3">
            {STATUS.map(({ t, n, s, p }) => (
              <div key={t} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-300 text-xs font-mono truncate">{t}</p>
                    <span className="text-slate-500 text-xs ml-2 flex-shrink-0">{n}</span>
                  </div>
                  <div className="bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${s === 'completo' ? 'bg-green-500' : s === 'parcial' ? 'bg-yellow-500' : 'bg-slate-700'}`}
                      style={{ width: `${p}%` }}/>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  s === 'completo' ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                  s === 'parcial'  ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                  'bg-slate-700/50 text-slate-400 border border-slate-700'}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-4 pt-3 border-t border-slate-800">
            Ejecuta <code className="text-blue-400 bg-slate-800 px-1 rounded">bulk_load.py</code> para completar la carga
          </p>
        </div>
      </div>
    </div>
  )
}
