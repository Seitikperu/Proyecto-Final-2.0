'use client'

import React from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  LabelList
} from 'recharts'

// --- Mock Data ---

const dataHistoricoMensual = [
  { name: 'agosto',     ingreso: 396007, salida: 130000, balance: 198795, inventario: 4558613 },
  { name: 'septiembre', ingreso: 342169, salida: 110000, balance: 149778, inventario: 4678416 },
  { name: 'octubre',    ingreso: 521487, salida: 182295, balance: 339192, inventario: 5017608 },
  { name: 'noviembre',  ingreso: 170583, salida: 60000,  balance: 74178,  inventario: 5091787 },
]

const dataDetalleInventario = [
  { name: 'REPUESTOS', value: 549656 },
  { name: 'NEUMATICOS Y AC...', value: 69561 },
  { name: 'MANGUERAS, TUB...', value: 37338 },
  { name: 'MATERIALES DE FE...', value: 29822 },
  { name: 'REPUESTOS EQUIP...', value: 21142 },
  { name: 'MATERIALES ELECT...', value: 12379 },
  { name: 'PERNOS, TUERCAS ...', value: 8522 },
  { name: 'SOLDADURA', value: 3455 },
]

const dataHistoricoSemanal = [
  { name: '45', ingreso: 114154 },
  { name: '46', ingreso: 56430 },
]

// Custom tick formatter for large numbers (e.g., 4000000 -> 4 mill.)
const formatYAxis = (value: number) => {
  if (value >= 1000000) return `${value / 1000000} mill.`
  if (value >= 1000) return `${value / 1000} mil`
  return value.toString()
}

// Custom tooltip for better formatting
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-md text-sm">
        <p className="font-bold text-slate-800 mb-2 capitalize">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-slate-600">{entry.name}:</span>
            <span className="font-semibold">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function ReportesDashboard() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      {/* HEADER LOGISTICA */}
      <div className="bg-[#1d2060] text-white text-center py-2 text-2xl font-bold tracking-widest shadow-md">
        LOGISTICA
      </div>

      <div className="p-4 md:p-6 flex-1 flex flex-col">
        
        {/* FILTERS */}
        <div className="flex flex-wrap gap-4 mb-6 relative">
          <div className="w-48">
            <div className="bg-[#1d2060] text-white text-xs font-bold px-2 py-1 uppercase">AÑO</div>
            <div className="border border-slate-300 flex items-center px-2 py-1.5 mt-1 text-sm bg-white">
              <div className="w-3 h-3 bg-slate-800 mr-2"></div>
              <span>2025</span>
            </div>
          </div>
          <div className="w-48">
            <div className="bg-[#1d2060] text-white text-xs font-bold px-2 py-1 uppercase">MES</div>
            <select className="w-full border border-slate-300 px-2 py-1.5 mt-1 text-sm bg-white outline-none">
              <option>11-25</option>
            </select>
          </div>
          <div className="w-48">
            <div className="bg-[#1d2060] text-white text-xs font-bold px-2 py-1 uppercase">SEMANA</div>
            <select className="w-full border border-slate-300 px-2 py-1.5 mt-1 text-sm bg-white outline-none">
              <option>Todas</option>
            </select>
          </div>
          <div className="w-48">
            <div className="bg-[#1d2060] text-white text-xs font-bold px-2 py-1 uppercase">SEMANA</div>
            <select className="w-full border border-slate-300 px-2 py-1.5 mt-1 text-sm bg-white outline-none">
              <option>Todas</option>
            </select>
          </div>

          <div className="ml-auto text-right self-end">
            <div className="text-2xl font-light text-slate-800 tracking-wider">14-11-25</div>
            <div className="text-xs text-slate-400">Ultima Actualización AL.</div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          
          {/* LEFT COLUMN: HISTORICO VALOR DE INVENTARIO */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-[#1d2060] text-white text-sm font-bold px-3 py-1 mb-2 uppercase">
              HISTORICO VALOR DE INVENTARIO
            </div>
            
            <div className="flex-1 bg-white pt-4 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataHistoricoMensual} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                    dy={10} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={formatYAxis}
                    domain={[0, 5000000]}
                    ticks={[0, 1000000, 2000000, 3000000, 4000000, 5000000]}
                    label={{ value: 'Ingreso. Salida y Balance almacen', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#475569', fontSize: 13, fontWeight: 500 } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false} 
                    hide 
                    domain={[0, 6000000]} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    align="left" 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '12px', color: '#64748b', paddingBottom: '20px' }}
                  />

                  {/* Bars */}
                  <Bar yAxisId="left" dataKey="ingreso" name="Ingreso" fill="#4A85F6" barSize={30}>
                    <LabelList dataKey="ingreso" position="top" fill="#64748b" fontSize={11} offset={10} />
                  </Bar>
                  <Bar yAxisId="left" dataKey="salida" name="Salida" fill="#1d2060" barSize={30}>
                    <LabelList dataKey="salida" position="top" fill="#64748b" fontSize={11} offset={10} />
                  </Bar>
                  <Bar yAxisId="left" dataKey="balance" name="Balance almacen" fill="#D97745" barSize={30}>
                    <LabelList dataKey="balance" position="top" fill="#64748b" fontSize={11} offset={10} />
                  </Bar>

                  {/* Line */}
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="inventario" 
                    name="Inventario" 
                    stroke="#611C54" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#611C54', strokeWidth: 2, stroke: '#611C54' }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList 
                      dataKey="inventario" 
                      position="bottom" 
                      fill="#fff" 
                      fontSize={11} 
                      fontWeight={600}
                      offset={10} 
                      formatter={(value: any) => value}
                      content={(props: any) => {
                        const { x, y, value } = props;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <rect x="-30" y="10" width="60" height="20" fill="#E06C75" rx="4" />
                            <text x="0" y="24" fill="#fff" fontSize="11" textAnchor="middle" fontWeight="bold">
                              {value}
                            </text>
                          </g>
                        )
                      }}
                    />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
              <div className="text-center text-sm font-bold text-slate-700 mt-2">Mes</div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* TOP RIGHT: DETALLE DE INVENTARIO */}
            <div className="flex-1 flex flex-col">
              <div className="bg-[#1d2060] text-white text-sm font-bold px-3 py-1 mb-2 uppercase">
                DETALLE DE INVENTARIO
              </div>
              <div className="flex-1 bg-white min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={dataDetalleInventario}
                    margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(value) => value >= 100000 ? `${(value/1000000).toFixed(1)} mill.` : value}
                      domain={[0, 'dataMax + 100000']}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#475569' }}
                      width={120}
                      label={{ value: 'NUEVA FAMILIA', angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle', fill: '#475569', fontSize: 12, fontWeight: 500 } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#4A85F6" barSize={20}>
                      <LabelList dataKey="value" position="right" fill="#475569" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-sm font-bold text-slate-700 mt-0">Valor de Inventario</div>
              </div>
            </div>

            {/* BOTTOM RIGHT: HISTORICO VALOR DE INVENTARIO (SEMANAL) */}
            <div className="h-64 flex flex-col">
              <div className="bg-[#1d2060] text-white text-sm font-bold px-3 py-1 mb-2 uppercase">
                HISTORICO VALOR DE INVENTARIO
              </div>
              <div className="flex-1 bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataHistoricoSemanal} margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#64748b' }} 
                      dy={10} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(value) => value >= 1000 ? `${value/1000} mil` : value}
                      label={{ value: 'Ingreso', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle', fill: '#475569', fontSize: 11, fontWeight: 500 } }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="ingreso" fill="#4A85F6" barSize={60}>
                      <LabelList dataKey="ingreso" position="top" fill="#64748b" fontSize={11} offset={10} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="text-center text-xs font-semibold text-slate-700 mt-0">Semana-Cis</div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
