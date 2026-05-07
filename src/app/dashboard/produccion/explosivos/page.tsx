'use client'

import { useState, useEffect, useCallback } from 'react'
import { BackButton } from '@/components/ui/BackButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type PersonalItem = { id: number; datos: string }

type FormDraft = {
  fecha:                string
  tipo_disparo:         string
  jefe_guardia:         string
  supervisor:           string
  operador:             string
  cargador:             string
  labor:                string
  tipo_actividad:       string
  nvale:                string
  tipo_fanel:           string
  longitud_perforacion: string
  emulex_25x400:        string
  emulex_38x400:        string
  anfo:                 string
  cordon_detonante:     string
  deton_electronicos:   string
  cable_electrico:      string
  mecha_seguridad:      string
  faneles:              Record<string, string>
}

type ExploRow = {
  id:                   number
  fecha:                string
  tipo_disparo:         string | null
  labor:                string | null
  tipo_actividad:       string | null
  nvale:                string | null
  tipo_fanel:           string | null
  longitud_perforacion: number | null
  cargador:             string | null
  jefe_guardia:         string | null
}

const FANEL_NUMS = Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }
function numOrNull(val: string) { return val.trim() ? parseFloat(val) : null }

const SEL = 'w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red'
const INP = 'w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red placeholder:text-brand-gray'
const NUM = 'w-full bg-slate-50 border border-slate-300 text-brand-black rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-brand-red placeholder:text-brand-gray'
const LBL = 'text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 block'

function emptyForm(): FormDraft {
  return {
    fecha: today(), tipo_disparo: '', jefe_guardia: '', supervisor: '', operador: '',
    cargador: '', labor: '', tipo_actividad: '', nvale: '', tipo_fanel: '',
    longitud_perforacion: '', emulex_25x400: '', emulex_38x400: '', anfo: '',
    cordon_detonante: '', deton_electronicos: '', cable_electrico: '', mecha_seguridad: '',
    faneles: {},
  }
}

type ScalarKey = Exclude<keyof FormDraft, 'faneles'>

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ExplosivosPage() {
  const [proyectoNombre, setProyectoNombre] = useState<string | null>(null)
  const [form, setForm]                     = useState<FormDraft>(emptyForm())
  const [saving, setSaving]                 = useState(false)
  const [rows, setRows]                     = useState<ExploRow[]>([])
  const [loading, setLoading]               = useState(false)
  const [filtroFecha, setFiltroFecha]       = useState(today())
  const [personal, setPersonal]             = useState<PersonalItem[]>([])

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
      .from('bd_personal')
      .select('id, datos')
      .eq('proyecto_nombre', proyectoNombre)
      .order('datos')
      .then(({ data }) => setPersonal((data ?? []) as PersonalItem[]))
  }, [proyectoNombre])

  const fetchRows = useCallback(async () => {
    if (!proyectoNombre) return
    setLoading(true)
    const { data, error } = await getSupabaseClient()
      .from('explosivo_registro')
      .select('id, fecha, tipo_disparo, labor, tipo_actividad, nvale, tipo_fanel, longitud_perforacion, cargador, jefe_guardia')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', filtroFecha)
      .order('id', { ascending: false })
    if (!error) setRows((data ?? []) as ExploRow[])
    setLoading(false)
  }, [proyectoNombre, filtroFecha])

  useEffect(() => { fetchRows() }, [fetchRows])

  function setField(key: ScalarKey, val: string) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function setFanel(num: string, val: string) {
    setForm(p => ({ ...p, faneles: { ...p.faneles, [num]: val } }))
  }

  async function guardar() {
    if (!form.labor) { showToast('error', 'Ingrese la labor'); return }
    if (!proyectoNombre) return

    setSaving(true)

    const fanelesPayload: Record<string, number | null> = {}
    for (const n of FANEL_NUMS) {
      fanelesPayload[`fanel_${n}`] = numOrNull(form.faneles[n] ?? '')
    }

    const { error } = await getSupabaseClient()
      .from('explosivo_registro')
      .insert({
        fecha:                form.fecha,
        tipo_disparo:         form.tipo_disparo || null,
        jefe_guardia:         form.jefe_guardia || null,
        supervisor:           form.supervisor || null,
        operador:             form.operador || null,
        cargador:             form.cargador || null,
        labor:                form.labor,
        tipo_actividad:       form.tipo_actividad || null,
        nvale:                form.nvale || null,
        tipo_fanel:           form.tipo_fanel || null,
        longitud_perforacion: numOrNull(form.longitud_perforacion),
        emulex_25x400:        numOrNull(form.emulex_25x400),
        emulex_38x400:        numOrNull(form.emulex_38x400),
        anfo:                 numOrNull(form.anfo),
        cordon_detonante:     numOrNull(form.cordon_detonante),
        deton_electronicos:   numOrNull(form.deton_electronicos),
        cable_electrico:      numOrNull(form.cable_electrico),
        mecha_seguridad:      numOrNull(form.mecha_seguridad),
        proyecto_nombre:      proyectoNombre,
        ...fanelesPayload,
      })

    if (error) {
      showToast('error', 'Error al guardar registro')
    } else {
      showToast('success', 'Registro de explosivos guardado')
      const savedFecha = form.fecha
      setForm(emptyForm())
      if (savedFecha === filtroFecha) fetchRows()
    }
    setSaving(false)
  }

  async function deleteRow(id: number) {
    const { error } = await getSupabaseClient().from('explosivo_registro').delete().eq('id', id)
    if (error) {
      showToast('error', 'Error al eliminar')
    } else {
      setRows(p => p.filter(r => r.id !== id))
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-5">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 flex items-center gap-4 shadow-sm">
        <BackButton />
        <h1 className="text-2xl font-black text-brand-black tracking-wide mx-auto pr-12 uppercase">
          Explosivos
        </h1>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-5">
        <h2 className="text-sm font-bold text-brand-black uppercase tracking-wider">Nuevo Registro</h2>

        {/* Datos generales */}
        <div>
          <p className="text-xs text-brand-gray font-semibold uppercase tracking-wider mb-3 border-b border-slate-200 shadow-sm pb-1">Datos Generales</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className={LBL}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} className={SEL} />
            </div>
            <div>
              <label className={LBL}>Tipo Disparo</label>
              <input value={form.tipo_disparo} onChange={e => setField('tipo_disparo', e.target.value)} className={INP} placeholder="ej. VOLADURA" />
            </div>
            <div>
              <label className={LBL}>N° Vale</label>
              <input value={form.nvale} onChange={e => setField('nvale', e.target.value)} className={INP} placeholder="ej. V-0001" />
            </div>
            <div>
              <label className={LBL}>Labor *</label>
              <input value={form.labor} onChange={e => setField('labor', e.target.value)} className={INP} placeholder="Ingrese labor..." />
            </div>
            <div>
              <label className={LBL}>Tipo Actividad</label>
              <input value={form.tipo_actividad} onChange={e => setField('tipo_actividad', e.target.value)} className={INP} placeholder="Opcional" />
            </div>
            <div>
              <label className={LBL}>Jefe de Guardia</label>
              <select value={form.jefe_guardia} onChange={e => setField('jefe_guardia', e.target.value)} className={SEL}>
                <option value="">Seleccione...</option>
                {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Supervisor</label>
              <select value={form.supervisor} onChange={e => setField('supervisor', e.target.value)} className={SEL}>
                <option value="">Seleccione...</option>
                {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Operador</label>
              <select value={form.operador} onChange={e => setField('operador', e.target.value)} className={SEL}>
                <option value="">Seleccione...</option>
                {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
              </select>
            </div>
            <div>
              <label className={LBL}>Cargador</label>
              <select value={form.cargador} onChange={e => setField('cargador', e.target.value)} className={SEL}>
                <option value="">Seleccione...</option>
                {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Cantidades de explosivos */}
        <div>
          <p className="text-xs text-brand-gray font-semibold uppercase tracking-wider mb-3 border-b border-slate-200 shadow-sm pb-1">Cantidades de Explosivos</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {([
              ['emulex_25x400',    'Emulex 25×400'],
              ['emulex_38x400',    'Emulex 38×400'],
              ['anfo',             'ANFO'],
              ['cordon_detonante', 'Cordón Det.'],
              ['deton_electronicos','Det. Elec.'],
              ['cable_electrico',  'Cable Elec.'],
              ['mecha_seguridad',  'Mecha Seg.'],
            ] as [ScalarKey, string][]).map(([key, label]) => (
              <div key={key}>
                <label className={LBL}>{label}</label>
                <input type="number" step="0.01" min="0"
                  value={form[key]} onChange={e => setField(key, e.target.value)}
                  className={NUM} placeholder="0" />
              </div>
            ))}
          </div>
        </div>

        {/* Perforación y faneles */}
        <div>
          <p className="text-xs text-brand-gray font-semibold uppercase tracking-wider mb-3 border-b border-slate-200 shadow-sm pb-1">Perforación y Faneles</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className={LBL}>Tipo Fanel</label>
              <input value={form.tipo_fanel} onChange={e => setField('tipo_fanel', e.target.value)} className={INP} placeholder="ej. LP-25" />
            </div>
            <div>
              <label className={LBL}>Long. Perforación (m)</label>
              <input type="number" step="0.01" min="0" value={form.longitud_perforacion}
                onChange={e => setField('longitud_perforacion', e.target.value)} className={NUM} placeholder="0.00" />
            </div>
          </div>

          <p className="text-xs text-brand-gray mb-2">Faneles por retardo (cantidad):</p>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
            {FANEL_NUMS.map(n => (
              <div key={n}>
                <label className="text-[10px] text-brand-gray text-center block mb-0.5">{n}</label>
                <input
                  type="number" step="1" min="0"
                  value={form.faneles[n] ?? ''}
                  onChange={e => setFanel(n, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-brand-black rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-red placeholder:text-slate-600"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={guardar}
            disabled={saving}
            className="px-6 py-2 bg-[#c83232] hover:bg-red-700 text-brand-black text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'GUARDAR REGISTRO'}
          </button>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-bold text-brand-black uppercase tracking-wider">Registros Guardados</h2>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-slate-600">Fecha:</label>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-brand-black rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300">
                {['Fecha','Tipo Disparo','Labor','Tipo Actividad','N° Vale','Tipo Fanel','Long. Perf.','Cargador','Jefe Guardia',''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-slate-700 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-slate-50 rounded animate-pulse w-14" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-brand-gray">
                    No hay registros de explosivos para {filtroFecha}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{row.fecha}</td>
                    <td className="px-3 py-2.5 text-slate-600">{row.tipo_disparo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-800 font-medium max-w-[160px] truncate" title={row.labor ?? ''}>{row.labor ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate">{row.tipo_actividad ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-mono">{row.nvale ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{row.tipo_fanel ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700 text-right font-mono">
                      {row.longitud_perforacion != null ? `${row.longitud_perforacion} m` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate">{row.cargador ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate">{row.jefe_guardia ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <button onClick={() => deleteRow(row.id)} className="text-red-500 hover:text-red-400 transition-colors" title="Eliminar">
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

        {!loading && (
          <div className="px-4 py-3 border-t border-slate-200 shadow-sm">
            <span className="text-brand-gray text-xs">{rows.length} registro(s)</span>
          </div>
        )}
      </div>
            </div>
    </div>
  )
}
