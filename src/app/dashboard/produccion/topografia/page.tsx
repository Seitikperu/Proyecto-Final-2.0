'use client'

import { useState, useEffect, useCallback } from 'react'
import { BackButton } from '@/components/ui/BackButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type CpRow = {
  id: number
  fecha: string
  turno: string
  labor: string
  actividad: string | null
  ejecutado: number | null
  observaciones: string | null
  avance_top: number | null
  ancho_top: number | null
  altura_top: number | null
  validacion_topografica: string | null
}

type RowState = {
  avance: string
  ancho: string
  alto: string
  saving: boolean
  validado: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split('T')[0]
}

const INP = 'w-20 bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#c83232]'
const SEL = 'bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c83232]'

// ─── Componente ───────────────────────────────────────────────────────────────

export default function TopografiaPage() {
  const [proyectoNombre, setProyectoNombre] = useState<string | null>(null)
  const [fecha, setFecha]                   = useState(today())
  const [filtroAct, setFiltroAct]           = useState('')
  const [cproyecto, setCproyecto]           = useState<CpRow[]>([])
  const [rowStates, setRowStates]           = useState<Record<number, RowState>>({})
  const [actividades, setActividades]       = useState<string[]>([])
  const [loading, setLoading]               = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cis_proyecto')
      const p = raw ? JSON.parse(raw) : null
      setProyectoNombre(p?.nombre ?? null)
    } catch { /* noop */ }
  }, [])

  useEffect(() => {
    if (!proyectoNombre) return
    getSupabaseClient()
      .from('cproyecto')
      .select('actividad')
      .eq('proyecto_nombre', proyectoNombre)
      .not('actividad', 'is', null)
      .then(({ data }) => {
        const unique = [...new Set((data ?? []).map(r => r.actividad).filter(Boolean))].sort()
        setActividades(unique as string[])
      })
  }, [proyectoNombre])

  const fetchData = useCallback(async () => {
    if (!proyectoNombre) return
    setLoading(true)

    const sb = getSupabaseClient()
    let q = sb
      .from('cproyecto')
      .select('id, fecha, turno, labor, actividad, ejecutado, observaciones, avance_top, ancho_top, altura_top, validacion_topografica')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', fecha)
      .order('turno')
      .order('labor')

    if (filtroAct) q = q.eq('actividad', filtroAct)

    const { data: cpData, error } = await q

    if (error) {
      showToast('error', 'Error cargando registros de producción')
      setLoading(false)
      return
    }

    const rows: CpRow[] = cpData ?? []
    setCproyecto(rows)

    if (rows.length === 0) {
      setRowStates({})
      setLoading(false)
      return
    }

    const states: Record<number, RowState> = {}
    for (const row of rows) {
      states[row.id] = {
        avance:  row.avance_top  != null ? String(row.avance_top)  : '',
        ancho:   row.ancho_top   != null ? String(row.ancho_top)   : '',
        alto:    row.altura_top  != null ? String(row.altura_top)  : '',
        saving:  false,
        validado: row.validacion_topografica === 'SI',
      }
    }
    setRowStates(states)
    setLoading(false)
  }, [proyectoNombre, fecha, filtroAct])

  useEffect(() => { fetchData() }, [fetchData])

  function setField(id: number, field: 'avance' | 'ancho' | 'alto', val: string) {
    setRowStates(p => ({ ...p, [id]: { ...p[id], [field]: val } }))
  }

  async function validar(row: CpRow) {
    const st = rowStates[row.id]
    if (!st) return

    setRowStates(p => ({ ...p, [row.id]: { ...p[row.id], saving: true } }))

    const { error } = await getSupabaseClient()
      .from('cproyecto')
      .update({
        avance_top:             st.avance ? parseFloat(st.avance) : null,
        ancho_top:              st.ancho  ? parseFloat(st.ancho)  : null,
        altura_top:             st.alto   ? parseFloat(st.alto)   : null,
        validacion_topografica: 'SI',
      })
      .eq('id', row.id)

    if (error) {
      showToast('error', 'Error al guardar topografía')
      setRowStates(p => ({ ...p, [row.id]: { ...p[row.id], saving: false } }))
    } else {
      showToast('success', `Validado — ${row.labor}`)
      setRowStates(p => ({ ...p, [row.id]: { ...p[row.id], saving: false, validado: true } }))
    }
  }

  const validados = Object.values(rowStates).filter(s => s.validado).length

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold text-white">Topografía</h1>
          <p className="text-slate-400 text-sm">Registro y validación de avances topográficos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={SEL} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Actividad</label>
            <select value={filtroAct} onChange={e => setFiltroAct(e.target.value)} className={`${SEL} min-w-[200px]`}>
              <option value="">Todas las actividades</option>
              {actividades.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                {['Fecha','Turno','Labor','Actividad','Ejec.','Observaciones','Avance (m)','Ancho (m)','Alto (m)','Validar'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : cproyecto.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    No hay registros de producción para la fecha y filtros seleccionados
                  </td>
                </tr>
              ) : (
                cproyecto.map(row => {
                  const st = rowStates[row.id]
                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors ${st?.validado ? 'bg-green-900/10 hover:bg-green-900/20' : 'hover:bg-slate-800/50'}`}
                    >
                      <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap text-xs">{row.fecha}</td>

                      <td className="px-3 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          row.turno === 'DIA'
                            ? 'bg-amber-900/60 text-amber-300'
                            : 'bg-blue-900/60 text-blue-300'
                        }`}>
                          {row.turno}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-slate-200 font-medium max-w-[180px] truncate text-xs" title={row.labor}>
                        {row.labor}
                      </td>

                      <td className="px-3 py-2.5 text-slate-400 text-xs max-w-[120px] truncate" title={row.actividad ?? ''}>
                        {row.actividad ?? '—'}
                      </td>

                      <td className="px-3 py-2.5 text-slate-300 text-center text-xs">
                        {row.ejecutado ?? '—'}
                      </td>

                      <td className="px-3 py-2.5 text-slate-400 text-xs max-w-[140px] truncate" title={row.observaciones ?? ''}>
                        {row.observaciones ?? '—'}
                      </td>

                      <td className="px-3 py-2.5">
                        <input type="number" step="0.01" min="0"
                          value={st?.avance ?? ''}
                          onChange={e => setField(row.id, 'avance', e.target.value)}
                          className={INP} placeholder="0.00"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input type="number" step="0.01" min="0"
                          value={st?.ancho ?? ''}
                          onChange={e => setField(row.id, 'ancho', e.target.value)}
                          className={INP} placeholder="0.00"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <input type="number" step="0.01" min="0"
                          value={st?.alto ?? ''}
                          onChange={e => setField(row.id, 'alto', e.target.value)}
                          className={INP} placeholder="0.00"
                        />
                      </td>

                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => validar(row)}
                          disabled={st?.saving}
                          title={st?.validado ? 'Ya validado — clic para actualizar' : 'Guardar y validar'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all disabled:opacity-50 ${
                            st?.validado
                              ? 'bg-green-700 hover:bg-green-600 text-white'
                              : 'bg-slate-700 hover:bg-green-700 text-slate-300 hover:text-white'
                          }`}
                        >
                          {st?.saving ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                            </svg>
                          )}
                          {st?.validado ? 'OK' : 'Validar'}
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && cproyecto.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-500 text-xs">{cproyecto.length} registros encontrados</span>
            <span className={`text-xs font-semibold ${validados === cproyecto.length ? 'text-green-400' : 'text-slate-400'}`}>
              {validados} / {cproyecto.length} validados
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
