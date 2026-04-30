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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard de Almacén</h1>
          <p className="text-gray-500 text-sm mt-0.5">Indicadores principales del almacén</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
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
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-gray-500 text-sm mb-2 font-medium">{label}</p>
            <p className="text-gray-900 text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-gray-800 font-bold text-sm mb-5 uppercase tracking-wide">Top familias por valor (USD)</h2>
          {fl ? <p className="text-gray-500 text-sm">Cargando...</p> : (
            <div className="space-y-4">
              {familias.map((d, i) => (
                <div key={d.familia} className="flex items-center gap-4">
                  <p className="text-gray-600 text-xs w-44 truncate flex-shrink-0 font-medium">{d.familia}</p>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full bg-[#c83232]" style={{ width: `${(d.valor / max) * 100}%` }}/>
                  </div>
                  <p className="text-gray-800 font-semibold text-xs w-20 text-right flex-shrink-0">{fmtUSD(d.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-gray-800 font-bold text-sm mb-5 uppercase tracking-wide">Estado de carga de datos</h2>
          <div className="space-y-4">
            {STATUS.map(({ t, n, s, p }) => (
              <div key={t} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-gray-600 text-xs font-mono font-semibold truncate">{t}</p>
                    <span className="text-gray-500 text-xs ml-2 flex-shrink-0 font-medium">{n}</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${s === 'completo' ? 'bg-green-500' : s === 'parcial' ? 'bg-yellow-500' : 'bg-gray-300'}`}
                      style={{ width: `${p}%` }}/>
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded flex-shrink-0 ${
                  s === 'completo' ? 'bg-green-50 text-green-600 border border-green-200' :
                  s === 'parcial'  ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                  'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                  {s}
                </span>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-5 pt-4 border-t border-gray-100">
            Ejecuta <code className="text-[#c83232] bg-red-50 px-1.5 py-0.5 rounded font-mono font-semibold">bulk_load.py</code> para completar la carga
          </p>
        </div>
      </div>
    </div>
  )
}
