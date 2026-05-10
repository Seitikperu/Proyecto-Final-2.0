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

type CpRowPending = {
  id:                 number
  fecha:              string
  turno:              string
  labor:              string
  actividad:          string | null
  jefe_guardia_turno: string | null
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
  
  // Vistas: 'list' (Resumen pendiente) | 'form' (Formulario detallado)
  const [view, setView]                     = useState<'list' | 'form'>('list')
  const [selectedCp, setSelectedCp]         = useState<CpRowPending | null>(null)

  const [form, setForm]                     = useState<FormDraft>(emptyForm())
  const [saving, setSaving]                 = useState(false)
  
  const [pendingRows, setPendingRows]       = useState<CpRowPending[]>([])
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

  // Obtener reportes pendientes de cproyecto
  const fetchPending = useCallback(async () => {
    if (!proyectoNombre) return
    setLoading(true)
    const { data, error } = await getSupabaseClient()
      .from('cproyecto')
      .select('id, fecha, turno, labor, actividad, jefe_guardia_turno')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', filtroFecha)
      .in('actividad', ['Avance', 'Mineral Volado'])
      .is('validacion_explo', false) // Asumiendo que es boolean false o null, a veces es necesario un .or('validacion_explo.is.null,validacion_explo.eq.false')
      .order('id', { ascending: false })

    // Supabase .is('validacion_explo', false) podría no traer los NULL. 
    // Por si acaso, haremos una consulta con .or()
    const { data: dataCorrect, error: errCorrect } = await getSupabaseClient()
      .from('cproyecto')
      .select('id, fecha, turno, labor, actividad, jefe_guardia_turno')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', filtroFecha)
      .in('actividad', ['Avance', 'Mineral Volado'])
      .or('validacion_explo.is.null,validacion_explo.eq.false')
      .order('id', { ascending: false })

    if (!errCorrect) {
      setPendingRows((dataCorrect ?? []) as CpRowPending[])
    } else {
      console.error(errCorrect)
    }
    setLoading(false)
  }, [proyectoNombre, filtroFecha])

  useEffect(() => { 
    if (view === 'list') fetchPending() 
  }, [fetchPending, view])

  function setField(key: ScalarKey, val: string) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function setFanel(num: string, val: string) {
    setForm(p => ({ ...p, faneles: { ...p.faneles, [num]: val } }))
  }

  function handleSelectRow(row: CpRowPending) {
    setSelectedCp(row)
    setForm({
      ...emptyForm(),
      fecha: row.fecha,
      labor: row.labor,
      tipo_actividad: row.actividad || '',
      jefe_guardia: row.jefe_guardia_turno || ''
    })
    setView('form')
  }

  function handleCancel() {
    setView('list')
    setSelectedCp(null)
    setForm(emptyForm())
  }

  async function guardar() {
    if (!form.labor) { showToast('error', 'Ingrese la labor'); return }
    if (!selectedCp) { showToast('error', 'No hay labor seleccionada'); return }
    if (!proyectoNombre) return

    setSaving(true)

    const fanelesPayload: Record<string, number | null> = {}
    for (const n of FANEL_NUMS) {
      fanelesPayload[`fanel_${n}`] = numOrNull(form.faneles[n] ?? '')
    }

    // 1. Insertar en explosivo_registro
    const { error: errInsert } = await getSupabaseClient()
      .from('explosivo_registro')
      .insert({
        id_cproyecto:         selectedCp.id, // Nueva columna
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

    if (errInsert) {
      console.error(errInsert)
      showToast('error', 'Error al guardar registro de explosivos')
      setSaving(false)
      return
    }

    // 2. Actualizar cproyecto.validacion_explo
    const { error: errUpdate } = await getSupabaseClient()
      .from('cproyecto')
      .update({ validacion_explo: true })
      .eq('id', selectedCp.id)

    if (errUpdate) {
      console.error(errUpdate)
      showToast('error', 'Consumo guardado, pero falló la actualización en Control de Proyecto')
    } else {
      showToast('success', 'Registro completado y validado')
    }

    setSaving(false)
    handleCancel() // Vuelve a la lista y refresca
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-5">

        {/* Header */}
        <div className="bg-white border-b border-slate-200 py-4 px-6 flex items-center gap-4 shadow-sm">
          {view === 'form' ? (
             <button onClick={handleCancel} className="text-brand-gray hover:text-brand-black transition-colors" title="Volver a lista">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
               </svg>
             </button>
          ) : (
            <BackButton />
          )}
          <h1 className="text-2xl font-black text-brand-black tracking-wide mx-auto pr-12 uppercase">
            {view === 'list' ? 'Registro de Consumo de Explosivos' : 'Validar Explosivos'}
          </h1>
        </div>

        {view === 'list' ? (
          /* =========================================================================
             VISTA 1: LISTA DE REPORTES PENDIENTES
             ========================================================================= */
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="px-4 py-4 border-b border-slate-200 shadow-sm flex flex-wrap items-center gap-4 bg-brand-navy text-white">
              <h2 className="text-sm font-bold uppercase tracking-wider">Reportes Pendientes</h2>
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs text-slate-300">Fecha:</label>
                <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="px-4 py-3 text-left text-slate-700 font-bold uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-slate-700 font-bold uppercase tracking-wider">Turno</th>
                    <th className="px-4 py-3 text-left text-slate-700 font-bold uppercase tracking-wider">Labor</th>
                    <th className="px-4 py-3 text-left text-slate-700 font-bold uppercase tracking-wider">Tipo Voladura</th>
                    <th className="px-4 py-3 text-center text-slate-700 font-bold uppercase tracking-wider">Esp. Perfor(M)</th>
                    <th className="px-4 py-3 text-left text-slate-700 font-bold uppercase tracking-wider">J. Guardia</th>
                    <th className="px-4 py-3 text-center text-slate-700 font-bold uppercase tracking-wider">Valid.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-4 bg-slate-200 rounded animate-pulse w-full max-w-[100px]" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : pendingRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No hay reportes de Avance o Mineral Volado pendientes de validación para el {filtroFecha}
                      </td>
                    </tr>
                  ) : (
                    pendingRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-800 whitespace-nowrap">{row.fecha}</td>
                        <td className="px-4 py-3 text-slate-700">{row.turno}</td>
                        <td className="px-4 py-3 text-slate-800 font-medium">{row.labor}</td>
                        <td className="px-4 py-3 text-slate-500">—</td> {/* Se deja en blanco según indicación */}
                        <td className="px-4 py-3 text-slate-500 text-center">—</td> {/* Se deja en blanco según indicación */}
                        <td className="px-4 py-3 text-slate-700">{row.jefe_guardia_turno || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => handleSelectRow(row)} 
                            className="bg-brand-red hover:bg-red-800 text-white px-4 py-1.5 rounded shadow-sm text-xs font-bold uppercase tracking-wider transition-colors"
                          >
                            Validar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 shadow-sm">
                <span className="text-slate-500 text-xs font-semibold">{pendingRows.length} reporte(s) pendiente(s)</span>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             VISTA 2: FORMULARIO DETALLADO (Como Imagen 02 / 01)
             ========================================================================= */
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-brand-black uppercase tracking-wider border-l-4 border-brand-red pl-2">
                Registro de Consumo
              </h2>
              <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-amber-200">
                Pendiente de Validación
              </span>
            </div>

            {/* Datos generales */}
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3 border-b border-slate-200 pb-1">Datos Generales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className={LBL}>Fecha</label>
                  <input type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} className={SEL} disabled />
                </div>
                <div>
                  <label className={LBL}>Labor *</label>
                  <input value={form.labor} onChange={e => setField('labor', e.target.value)} className={INP} disabled />
                </div>
                <div>
                  <label className={LBL}>Tipo Actividad</label>
                  <input value={form.tipo_actividad} onChange={e => setField('tipo_actividad', e.target.value)} className={INP} disabled />
                </div>
                <div>
                  <label className={LBL}>Jefe de Guardia</label>
                  <select value={form.jefe_guardia} onChange={e => setField('jefe_guardia', e.target.value)} className={SEL}>
                    <option value="">Seleccione...</option>
                    {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
                  </select>
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
            <div className="pt-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3 border-b border-slate-200 pb-1">Cantidades de Explosivos</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
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
            <div className="pt-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3 border-b border-slate-200 pb-1">Perforación y Faneles</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
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

              <p className="text-xs text-slate-600 font-medium mb-3">Faneles por retardo (cantidad):</p>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {FANEL_NUMS.map(n => (
                  <div key={n} className="bg-slate-50 rounded p-1 border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 text-center block mb-1">{n}</label>
                    <input
                      type="number" step="1" min="0"
                      value={form.faneles[n] ?? ''}
                      onChange={e => setFanel(n, e.target.value)}
                      className="w-full bg-white border border-slate-300 text-brand-black rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-brand-red placeholder:text-slate-300"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardar}
                disabled={saving}
                className="px-8 py-2.5 bg-brand-red hover:bg-red-800 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Guardando...
                  </>
                ) : 'Guardar y Validar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
