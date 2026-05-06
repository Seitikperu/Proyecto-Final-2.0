'use client'

import { useState, useEffect, useCallback } from 'react'
import { BackButton } from '@/components/ui/BackButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import SearchableSelect from '@/components/ui/SearchableSelect'

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
  numero_barras:      string
  codigo_equipo:      string
  jefe_guardia_turno: string
  ciclos:             Record<string, boolean>
}

type CpRow = {
  id:                 number
  fecha:              string
  turno:              string
  labor:              string
  actividad:          string | null
  ciclo:              string | null
  ejecutado:          string | null
  observaciones:      string | null
  filas_slot:         string | null
  numero_taladros:    number | null
  numero_barras:      number | null
  codigo_equipo:      string | null
  jefe_guardia_turno: string | null
}

const EMPTY: FormDraft = {
  labor: '', actividad: '', ejecutado: '', observaciones: '',
  filas_slot: '', numero_taladros: '', numero_barras: '', codigo_equipo: '', jefe_guardia_turno: '',
  ciclos: {
    limpieza: false,
    sostenimiento: false,
    en_proceso: false,
    bombeo: false,
    shotcrete: false,
    perforacion: false,
    voladura: false
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }

const INP = 'w-full bg-white border border-slate-300 text-brand-black rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent placeholder:text-slate-400'
const SEL = 'w-full bg-white border border-slate-300 text-brand-black rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent'
const LBL = 'text-sm font-bold text-slate-700 uppercase tracking-wide mb-1 block'
const CHK_LBL = 'text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer'

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
      .select('id, fecha, turno, labor, actividad, ciclo, ejecutado, observaciones, filas_slot, numero_taladros, numero_barras, codigo_equipo, jefe_guardia_turno')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', fecha)
      .eq('turno', turno)
      .order('id', { ascending: false })
    if (!error) setSavedRows((data ?? []) as CpRow[])
    setLoadingSaved(false)
  }, [proyectoNombre, fecha, turno])

  useEffect(() => { fetchSaved() }, [fetchSaved])

  function setField(key: keyof FormDraft, val: any) {
    setForm(p => ({ ...p, [key]: val }))
  }

  function setCiclo(key: string, val: boolean) {
    setForm(p => ({ ...p, ciclos: { ...p.ciclos, [key]: val } }))
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
    const rows = staging.map(s => {
      // Build ciclo string
      const selectedCiclos = Object.entries(s.ciclos)
        .filter(([_, isChecked]) => isChecked)
        .map(([key]) => key)
        .join(', ')

      return {
        fecha,
        turno,
        labor:              s.labor,
        actividad:          s.actividad || null,
        ciclo:              selectedCiclos || null,
        ejecutado:          s.ejecutado || null,
        observaciones:      s.observaciones || null,
        filas_slot:         s.filas_slot || null,
        numero_taladros:    s.numero_taladros ? parseInt(s.numero_taladros) : null,
        numero_barras:      s.numero_barras ? parseInt(s.numero_barras) : null,
        codigo_equipo:      s.codigo_equipo || null,
        jefe_guardia_turno: s.jefe_guardia_turno || null,
        proyecto_nombre:    proyectoNombre,
      }
    })

    const { error } = await getSupabaseClient().from('cproyecto').insert(rows)
    if (error) {
      console.error(error)
      showToast('error', 'Error al registrar en BD. Verifica que las columnas numero_barras y ciclo existan en la tabla cproyecto.')
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

  // Mapeo para opciones de combobox
  const laborOptions = labores.map(l => ({ value: l.titulo, label: l.titulo }))
  const actividadOptions = actividades.map(a => ({ value: a.titulo, label: a.titulo }))
  const equipoOptions = equipos.map(e => ({ value: e.titulo, label: e.titulo }))
  const personalOptions = personal.map(p => ({ value: p.datos, label: p.datos }))

  // Convert ciclo object to string for display in staging
  function getCicloString(ciclos: Record<string, boolean>) {
    return Object.entries(ciclos)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join(', ')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      {/* Header AESA Branding */}
      <div className="bg-white border-b border-slate-200 py-4 px-6 flex items-center gap-4 shadow-sm">
        <BackButton />
        <h1 className="text-2xl font-black text-brand-black tracking-wide mx-auto pr-12 uppercase">
          CONTROL DE PROYECTO
        </h1>
      </div>

      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        
        {/* Formulario Principal */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          
          {/* Fila 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-2">
              <label className={LBL}>Fecha</label>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={INP} />
            </div>
            
            <div className="md:col-span-2">
              <label className={LBL}>Turno</label>
              <select value={turno} onChange={e => setTurno(e.target.value)} className={SEL}>
                <option value="DIA">DIA</option>
                <option value="NOCHE">NOCHE</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={LBL}>Labor</label>
              <SearchableSelect 
                options={laborOptions} 
                value={form.labor} 
                onChange={v => setField('labor', v)} 
                placeholder="Buscar elementos"
                className="!bg-white !border-slate-300 !text-brand-black focus-within:!ring-brand-red"
              />
            </div>

            <div className="md:col-span-3">
              <label className={LBL}>Actividad</label>
              <SearchableSelect 
                options={actividadOptions} 
                value={form.actividad} 
                onChange={v => setField('actividad', v)} 
                placeholder="Buscar elementos"
                className="!bg-white !border-slate-300 !text-brand-black focus-within:!ring-brand-red"
              />
            </div>

            {/* Ciclo Checkboxes - Parte 1 */}
            <div className="md:col-span-2 pl-4 border-l border-slate-200">
              <label className={LBL}>Ciclo</label>
              <div className="space-y-1.5 mt-2">
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.limpieza} onChange={e => setCiclo('limpieza', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  Limpieza
                </label>
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.sostenimiento} onChange={e => setCiclo('sostenimiento', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  Sostenimiento
                </label>
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.en_proceso} onChange={e => setCiclo('en_proceso', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  En proceso
                </label>
              </div>
            </div>
          </div>

          {/* Fila 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-2">
              <label className={LBL}>Filas</label>
              <input value={form.filas_slot} onChange={e => setField('filas_slot', e.target.value)} className={INP} />
            </div>

            <div className="md:col-span-2">
              <label className={LBL}>N°Taladro</label>
              <input type="number" min="0" value={form.numero_taladros} onChange={e => setField('numero_taladros', e.target.value)} className={INP} />
            </div>

            <div className="md:col-span-2">
              <label className={LBL}>N° Barras</label>
              <input type="number" min="0" value={form.numero_barras} onChange={e => setField('numero_barras', e.target.value)} className={INP} />
            </div>

            <div className="md:col-span-2">
              <label className={LBL}>Equipo</label>
              <SearchableSelect 
                options={equipoOptions} 
                value={form.codigo_equipo} 
                onChange={v => setField('codigo_equipo', v)} 
                placeholder="Buscar elementos"
                className="!bg-white !border-slate-300 !text-brand-black focus-within:!ring-brand-red"
              />
            </div>

            <div className="md:col-span-2">
              <label className={LBL}>Ejecutado</label>
              <input value={form.ejecutado} onChange={e => setField('ejecutado', e.target.value)} className={INP} />
            </div>

            {/* Ciclo Checkboxes - Parte 2 */}
            <div className="md:col-span-2 pl-4">
              <div className="text-[10px] font-bold text-slate-400 mb-2 tracking-widest">L B SH S P V</div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.bombeo} onChange={e => setCiclo('bombeo', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  Bombeo
                </label>
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.shotcrete} onChange={e => setCiclo('shotcrete', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  Shotcrete
                </label>
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.perforacion} onChange={e => setCiclo('perforacion', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  Perforación
                </label>
                <label className={CHK_LBL}>
                  <input type="checkbox" checked={form.ciclos.voladura} onChange={e => setCiclo('voladura', e.target.checked)} className="accent-brand-red w-4 h-4" />
                  Voladura
                </label>
              </div>
            </div>
          </div>

          {/* Fila 3: Observaciones largas */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={LBL}>Observacion</label>
              <input value={form.observaciones} onChange={e => setField('observaciones', e.target.value)} className={INP} />
            </div>
          </div>

          {/* Fila 4: Acciones */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-6 mt-4">
            <button
              onClick={agregar}
              className="px-10 py-2.5 bg-white hover:bg-slate-50 text-brand-red border border-slate-300 text-lg font-bold rounded shadow-sm transition-colors uppercase tracking-widest whitespace-nowrap"
            >
              Agregar
            </button>
            
            <div className="flex-1 w-full max-w-sm">
              <label className="text-[10px] bg-black text-white px-2 py-0.5 block w-fit font-bold uppercase tracking-wider mb-0.5">Jefe de Guardia</label>
              <SearchableSelect 
                options={personalOptions} 
                value={form.jefe_guardia_turno} 
                onChange={v => setField('jefe_guardia_turno', v)} 
                placeholder="Buscar elementos"
                className="!bg-white !border-slate-300 !text-brand-black focus-within:!ring-brand-red"
              />
            </div>

            <button
              onClick={registrarABD}
              disabled={registrando}
              className="ml-auto px-10 py-2.5 bg-brand-red hover:bg-red-800 text-white text-lg font-bold rounded shadow-sm transition-colors disabled:opacity-50 uppercase tracking-widest"
            >
              {registrando ? 'Guardando...' : 'Registrar a BD'}
            </button>
          </div>
        </div>

        {/* Tabla Staging + Guardados combinados o separados */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg min-h-[400px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-red text-white">
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Turno</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Labor</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Actividad</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Ciclo</th>
                  <th className="px-4 py-2 text-center font-semibold uppercase tracking-wide">Ejecutado</th>
                  <th className="px-4 py-2 text-left font-semibold uppercase tracking-wide">Observacion</th>
                  <th className="px-4 py-2 text-center font-semibold uppercase tracking-wide">Borrar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                
                {/* Filas en cola (staging) */}
                {staging.map((s, i) => (
                  <tr key={`staging-${i}`} className="bg-amber-50 hover:bg-amber-100">
                    <td className="px-4 py-2 text-amber-900 font-medium">{fecha}</td>
                    <td className="px-4 py-2 text-amber-900">{turno}</td>
                    <td className="px-4 py-2 text-amber-900 truncate max-w-[200px]" title={s.labor}>{s.labor}</td>
                    <td className="px-4 py-2 text-amber-800 truncate max-w-[150px]">{s.actividad || '—'}</td>
                    <td className="px-4 py-2 text-amber-800 text-xs">{getCicloString(s.ciclos) || '—'}</td>
                    <td className="px-4 py-2 text-amber-800 text-center">{s.ejecutado || '—'}</td>
                    <td className="px-4 py-2 text-amber-800 truncate max-w-[200px]">{s.observaciones || '—'}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeStaging(i)} className="text-red-500 hover:text-red-700" title="Quitar de cola">
                        <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Filas guardadas en BD */}
                {loadingSaved ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`sk-${i}`}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-200 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : savedRows.length === 0 && staging.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-lg">
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  savedRows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-800 font-medium">{row.fecha}</td>
                      <td className="px-4 py-2 text-slate-700">{row.turno}</td>
                      <td className="px-4 py-2 text-slate-800 truncate max-w-[200px]" title={row.labor}>{row.labor}</td>
                      <td className="px-4 py-2 text-slate-600 truncate max-w-[150px]">{row.actividad ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600 text-xs">{row.ciclo ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600 text-center">{row.ejecutado ?? '—'}</td>
                      <td className="px-4 py-2 text-slate-600 truncate max-w-[200px]">{row.observaciones ?? '—'}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => deleteRecord(row.id)} className="text-slate-400 hover:text-red-600 transition-colors" title="Eliminar registro">
                          <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </div>

      </div>
    </div>
  )
}
