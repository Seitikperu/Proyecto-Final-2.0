'use client'

import { useState, useEffect, useCallback } from 'react'
import { BackButton } from '@/components/ui/BackButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type MasterItem   = { id: number; titulo: string }
type PersonalItem = { id: number; datos: string }

type FormDraft = {
  labor:              string
  actividad:          string
  ejecutado:          string
  observaciones:      string
  filas_slot:         string
  numero_taladros:    string
  codigo_equipo:      string
  jefe_guardia_turno: string
}

type CpRow = {
  id:                 number
  labor:              string
  actividad:          string | null
  ejecutado:          string | null
  observaciones:      string | null
  filas_slot:         string | null
  numero_taladros:    number | null
  codigo_equipo:      string | null
  jefe_guardia_turno: string | null
}

const EMPTY: FormDraft = {
  labor: '', actividad: '', ejecutado: '', observaciones: '',
  filas_slot: '', numero_taladros: '', codigo_equipo: '', jefe_guardia_turno: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }

const SEL = 'w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c83232]'
const INP = 'w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c83232] placeholder:text-slate-500'
const LBL = 'text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block'

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ControlProyectoPage() {
  const [proyectoNombre, setProyectoNombre] = useState<string | null>(null)
  const [fecha, setFecha]                   = useState(today())
  const [turno, setTurno]                   = useState('DIA')
  const [form, setForm]                     = useState<FormDraft>(EMPTY)
  const [staging, setStaging]               = useState<FormDraft[]>([])
  const [savedRows, setSavedRows]           = useState<CpRow[]>([])
  const [loadingSaved, setLoadingSaved]     = useState(false)
  const [registrando, setRegistrando]       = useState(false)

  const [labores, setLabores]         = useState<MasterItem[]>([])
  const [actividades, setActividades] = useState<MasterItem[]>([])
  const [equipos, setEquipos]         = useState<MasterItem[]>([])
  const [personal, setPersonal]       = useState<PersonalItem[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('cis_proyecto')
      const p = raw ? JSON.parse(raw) : null
      setProyectoNombre(p?.nombre ?? null)
    } catch { /* noop */ }
  }, [])

  // Cargar maestros una sola vez
  useEffect(() => {
    if (!proyectoNombre) return
    const sb = getSupabaseClient()
    Promise.all([
      sb.from('mlabor').select('id, titulo').eq('proyecto_nombre', proyectoNombre).order('titulo'),
      sb.from('actividad').select('id, titulo').eq('proyecto_nombre', proyectoNombre).order('titulo'),
      sb.from('maestro_equipos').select('id, titulo').eq('proyecto_nombre', proyectoNombre).order('titulo'),
      sb.from('bd_personal').select('id, datos').eq('proyecto_nombre', proyectoNombre).order('datos'),
    ]).then(([l, a, e, p]) => {
      setLabores((l.data ?? []) as MasterItem[])
      setActividades((a.data ?? []) as MasterItem[])
      setEquipos((e.data ?? []) as MasterItem[])
      setPersonal((p.data ?? []) as PersonalItem[])
    })
  }, [proyectoNombre])

  // Registros guardados para fecha + turno seleccionados
  const fetchSaved = useCallback(async () => {
    if (!proyectoNombre) return
    setLoadingSaved(true)
    const { data, error } = await getSupabaseClient()
      .from('cproyecto')
      .select('id, labor, actividad, ejecutado, observaciones, filas_slot, numero_taladros, codigo_equipo, jefe_guardia_turno')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', fecha)
      .eq('turno', turno)
      .order('id', { ascending: false })
    if (!error) setSavedRows((data ?? []) as CpRow[])
    setLoadingSaved(false)
  }, [proyectoNombre, fecha, turno])

  useEffect(() => { fetchSaved() }, [fetchSaved])

  function setField(key: keyof FormDraft, val: string) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function agregar() {
    if (!form.labor) { showToast('error', 'Seleccione una labor'); return }
    setStaging(p => [...p, { ...form }])
    setForm(EMPTY)
  }

  function removeStaging(idx: number) {
    setStaging(p => p.filter((_, i) => i !== idx))
  }

  async function registrarABD() {
    if (staging.length === 0) { showToast('error', 'No hay filas en cola'); return }
    if (!proyectoNombre) return

    setRegistrando(true)
    const rows = staging.map(s => ({
      fecha,
      turno,
      labor:              s.labor,
      actividad:          s.actividad || null,
      ejecutado:          s.ejecutado || null,
      observaciones:      s.observaciones || null,
      filas_slot:         s.filas_slot || null,
      numero_taladros:    s.numero_taladros ? parseInt(s.numero_taladros) : null,
      codigo_equipo:      s.codigo_equipo || null,
      jefe_guardia_turno: s.jefe_guardia_turno || null,
      proyecto_nombre:    proyectoNombre,
    }))

    const { error } = await getSupabaseClient().from('cproyecto').insert(rows)
    if (error) {
      showToast('error', 'Error al registrar en BD')
    } else {
      showToast('success', `${rows.length} registro(s) guardados`)
      setStaging([])
      fetchSaved()
    }
    setRegistrando(false)
  }

  async function deleteRecord(id: number) {
    const { error } = await getSupabaseClient().from('cproyecto').delete().eq('id', id)
    if (error) {
      showToast('error', 'Error al eliminar')
    } else {
      setSavedRows(p => p.filter(r => r.id !== id))
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold text-white">Control de Proyecto</h1>
          <p className="text-[#c83232] text-sm font-medium">Registro diario de producción por labor y turno</p>
        </div>
      </div>

      {/* Filtros de sesión */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className={LBL}>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={SEL} />
          </div>
          <div>
            <label className={LBL}>Turno</label>
            <select value={turno} onChange={e => setTurno(e.target.value)} className={`${SEL} w-36`}>
              <option value="DIA">DIA</option>
              <option value="NOCHE">NOCHE</option>
            </select>
          </div>
          <button
            onClick={fetchSaved}
            disabled={loadingSaved}
            className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Nuevo Registro</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div>
            <label className={LBL}>Labor *</label>
            <select value={form.labor} onChange={e => setField('labor', e.target.value)} className={SEL}>
              <option value="">Seleccione labor...</option>
              {labores.map(l => <option key={l.id} value={l.titulo}>{l.titulo}</option>)}
            </select>
          </div>

          <div>
            <label className={LBL}>Actividad</label>
            <select value={form.actividad} onChange={e => setField('actividad', e.target.value)} className={SEL}>
              <option value="">Seleccione actividad...</option>
              {actividades.map(a => <option key={a.id} value={a.titulo}>{a.titulo}</option>)}
            </select>
          </div>

          <div>
            <label className={LBL}>Ejecutado</label>
            <input value={form.ejecutado} onChange={e => setField('ejecutado', e.target.value)} className={INP} placeholder="ej. 25" />
          </div>

          <div>
            <label className={LBL}>Observaciones</label>
            <input value={form.observaciones} onChange={e => setField('observaciones', e.target.value)} className={INP} placeholder="Opcional" />
          </div>

          <div>
            <label className={LBL}>Filas / Slot</label>
            <input value={form.filas_slot} onChange={e => setField('filas_slot', e.target.value)} className={INP} placeholder="Opcional" />
          </div>

          <div>
            <label className={LBL}>Nro. Taladros</label>
            <input type="number" min="0" value={form.numero_taladros}
              onChange={e => setField('numero_taladros', e.target.value)} className={INP} placeholder="0" />
          </div>

          <div>
            <label className={LBL}>Equipo</label>
            <select value={form.codigo_equipo} onChange={e => setField('codigo_equipo', e.target.value)} className={SEL}>
              <option value="">Seleccione equipo...</option>
              {equipos.map(eq => <option key={eq.id} value={eq.titulo}>{eq.titulo}</option>)}
            </select>
          </div>

          <div>
            <label className={LBL}>Jefe de Guardia</label>
            <select value={form.jefe_guardia_turno} onChange={e => setField('jefe_guardia_turno', e.target.value)} className={SEL}>
              <option value="">Seleccione personal...</option>
              {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
            </select>
          </div>

        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={agregar}
            className="px-6 py-2 bg-[#c83232] hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors"
          >
            + AGREGAR A COLA
          </button>
        </div>
      </div>

      {/* Cola de staging */}
      {staging.length > 0 && (
        <div className="bg-slate-900 border border-amber-700/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-700/50 flex items-center justify-between bg-amber-900/10">
            <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
              Cola — {staging.length} fila(s) pendiente(s)
            </h2>
            <button
              onClick={registrarABD}
              disabled={registrando}
              className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {registrando ? 'Guardando...' : 'REGISTRAR A BD'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="bg-slate-800">
                  {['#','Labor','Actividad','Ejec.','Obs.','Filas/Slot','Taladros','Equipo','Jefe Guardia',''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {staging.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-800/50">
                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2 text-slate-200 font-medium max-w-[160px] truncate" title={s.labor}>{s.labor}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-[120px] truncate">{s.actividad || '—'}</td>
                    <td className="px-3 py-2 text-slate-300 text-center">{s.ejecutado || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-[100px] truncate">{s.observaciones || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 text-center">{s.filas_slot || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 text-center">{s.numero_taladros || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-[100px] truncate">{s.codigo_equipo || '—'}</td>
                    <td className="px-3 py-2 text-slate-400 max-w-[120px] truncate">{s.jefe_guardia_turno || '—'}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeStaging(i)} className="text-red-400 hover:text-red-300 transition-colors" title="Quitar de cola">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registros guardados */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Registros Guardados — {fecha} / {turno}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                {['Labor','Actividad','Ejec.','Observaciones','Filas/Slot','Taladros','Equipo','Jefe Guardia',''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-slate-300 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loadingSaved ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-slate-800 rounded animate-pulse w-16" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : savedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                    No hay registros guardados para {fecha} / {turno}
                  </td>
                </tr>
              ) : (
                savedRows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2.5 text-slate-200 font-medium max-w-[180px] truncate" title={row.labor}>{row.labor}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate">{row.actividad ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-center">{row.ejecutado ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate">{row.observaciones ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-center">{row.filas_slot ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 text-center">{row.numero_taladros ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[100px] truncate">{row.codigo_equipo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate">{row.jefe_guardia_turno ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => deleteRecord(row.id)}
                        className="text-red-500 hover:text-red-400 transition-colors"
                        title="Eliminar registro"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingSaved && (
          <div className="px-4 py-3 border-t border-slate-800">
            <span className="text-slate-500 text-xs">{savedRows.length} registro(s)</span>
          </div>
        )}
      </div>
    </div>
  )
}
