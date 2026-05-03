'use client'

import { useState, useEffect, useCallback } from 'react'
import { BackButton } from '@/components/ui/BackButton'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

// ─── Tipos ───────────────────────────────────────────────────────────────────

type PersonalItem = { id: number; datos: string }

type FormDraft = {
  fecha:                string
  turno:                string
  ubicacion_monitoreo:  string
  vps_mm_s:             string
  ruido_db:             string
  pico_l_db:            string
  labor:                string
  actividad:            string
  observaciones:        string
  responsable_registro: string
}

type VibRow = {
  id:                   number
  fecha:                string
  turno:                string
  ubicacion_monitoreo:  string | null
  vps_mm_s:             number | null
  ruido_db:             number | null
  pico_l_db:            number | null
  labor:                string | null
  actividad:            string | null
  observaciones:        string | null
  responsable_registro: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().split('T')[0] }

const SEL = 'w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c83232]'
const INP = 'w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#c83232] placeholder:text-slate-500'
const LBL = 'text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block'

function emptyForm(): FormDraft {
  return {
    fecha: today(), turno: 'DIA', ubicacion_monitoreo: '',
    vps_mm_s: '', ruido_db: '', pico_l_db: '',
    labor: '', actividad: '', observaciones: '', responsable_registro: '',
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function VibracionesPage() {
  const [proyectoNombre, setProyectoNombre] = useState<string | null>(null)
  const [form, setForm]                     = useState<FormDraft>(emptyForm())
  const [saving, setSaving]                 = useState(false)
  const [rows, setRows]                     = useState<VibRow[]>([])
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
      .from('vibraciones')
      .select('id, fecha, turno, ubicacion_monitoreo, vps_mm_s, ruido_db, pico_l_db, labor, actividad, observaciones, responsable_registro')
      .eq('proyecto_nombre', proyectoNombre)
      .eq('fecha', filtroFecha)
      .order('id', { ascending: false })
    if (!error) setRows((data ?? []) as VibRow[])
    setLoading(false)
  }, [proyectoNombre, filtroFecha])

  useEffect(() => { fetchRows() }, [fetchRows])

  function setField(key: keyof FormDraft, val: string) {
    setForm(p => ({ ...p, [key]: val }))
  }

  async function guardar() {
    if (!form.ubicacion_monitoreo) { showToast('error', 'Ingrese la ubicación de monitoreo'); return }
    if (!form.vps_mm_s && !form.ruido_db && !form.pico_l_db) {
      showToast('error', 'Ingrese al menos un valor de medición')
      return
    }
    if (!proyectoNombre) return

    setSaving(true)
    const { error } = await getSupabaseClient()
      .from('vibraciones')
      .insert({
        fecha:                form.fecha,
        turno:                form.turno,
        ubicacion_monitoreo:  form.ubicacion_monitoreo,
        vps_mm_s:             form.vps_mm_s  ? parseFloat(form.vps_mm_s)  : null,
        ruido_db:             form.ruido_db  ? parseFloat(form.ruido_db)  : null,
        pico_l_db:            form.pico_l_db ? parseFloat(form.pico_l_db) : null,
        labor:                form.labor || null,
        actividad:            form.actividad || null,
        observaciones:        form.observaciones || null,
        responsable_registro: form.responsable_registro || null,
        proyecto_nombre:      proyectoNombre,
      })

    if (error) {
      showToast('error', 'Error al guardar registro')
    } else {
      showToast('success', 'Registro de vibración guardado')
      const savedFecha = form.fecha
      setForm(emptyForm())
      if (savedFecha === filtroFecha) fetchRows()
    }
    setSaving(false)
  }

  async function deleteRow(id: number) {
    const { error } = await getSupabaseClient().from('vibraciones').delete().eq('id', id)
    if (error) {
      showToast('error', 'Error al eliminar')
    } else {
      setRows(p => p.filter(r => r.id !== id))
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold text-white">Vibraciones</h1>
          <p className="text-slate-400 text-sm">Registro de monitoreo de vibraciones y ruido</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Nuevo Registro</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          <div>
            <label className={LBL}>Fecha</label>
            <input type="date" value={form.fecha} onChange={e => setField('fecha', e.target.value)} className={SEL} />
          </div>

          <div>
            <label className={LBL}>Turno</label>
            <select value={form.turno} onChange={e => setField('turno', e.target.value)} className={SEL}>
              <option value="DIA">DIA</option>
              <option value="NOCHE">NOCHE</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className={LBL}>Ubicación de Monitoreo *</label>
            <input value={form.ubicacion_monitoreo} onChange={e => setField('ubicacion_monitoreo', e.target.value)} className={INP} placeholder="Ingrese ubicación..." />
          </div>

          <div>
            <label className={LBL}>VPS (mm/s)</label>
            <input type="number" step="0.001" min="0" value={form.vps_mm_s}
              onChange={e => setField('vps_mm_s', e.target.value)} className={INP} placeholder="0.000" />
          </div>

          <div>
            <label className={LBL}>Ruido dB</label>
            <input type="number" step="0.1" min="0" value={form.ruido_db}
              onChange={e => setField('ruido_db', e.target.value)} className={INP} placeholder="0.0" />
          </div>

          <div>
            <label className={LBL}>Pico L (dB)</label>
            <input type="number" step="0.1" min="0" value={form.pico_l_db}
              onChange={e => setField('pico_l_db', e.target.value)} className={INP} placeholder="0.0" />
          </div>

          <div>
            <label className={LBL}>Labor</label>
            <input value={form.labor} onChange={e => setField('labor', e.target.value)} className={INP} placeholder="Opcional" />
          </div>

          <div>
            <label className={LBL}>Actividad</label>
            <input value={form.actividad} onChange={e => setField('actividad', e.target.value)} className={INP} placeholder="Opcional" />
          </div>

          <div className="sm:col-span-2">
            <label className={LBL}>Observaciones</label>
            <input value={form.observaciones} onChange={e => setField('observaciones', e.target.value)} className={INP} placeholder="Opcional" />
          </div>

          <div className="sm:col-span-2">
            <label className={LBL}>Responsable de Registro</label>
            <select value={form.responsable_registro} onChange={e => setField('responsable_registro', e.target.value)} className={SEL}>
              <option value="">Seleccione personal...</option>
              {personal.map(p => <option key={p.id} value={p.datos}>{p.datos}</option>)}
            </select>
          </div>

        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={guardar}
            disabled={saving}
            className="px-6 py-2 bg-[#c83232] hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'GUARDAR REGISTRO'}
          </button>
        </div>
      </div>

      {/* Filtro y tabla de registros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center gap-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Registros Guardados</h2>
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-slate-400">Fecha:</label>
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#c83232]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-800 border-b border-slate-700">
                {['Fecha','Turno','Ubicación','VPS mm/s','Ruido dB','Pico L dB','Labor','Actividad','Responsable','Obs.',''].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-slate-300 font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 11 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-3 bg-slate-800 rounded animate-pulse w-14" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-500">
                    No hay registros de vibraciones para {filtroFecha}
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-3 py-2.5 text-slate-300 whitespace-nowrap">{row.fecha}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        row.turno === 'DIA' ? 'bg-amber-900/60 text-amber-300' : 'bg-blue-900/60 text-blue-300'
                      }`}>{row.turno}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-200 max-w-[160px] truncate" title={row.ubicacion_monitoreo ?? ''}>{row.ubicacion_monitoreo ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-right font-mono">{row.vps_mm_s != null ? row.vps_mm_s.toFixed(3) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-right font-mono">{row.ruido_db != null ? row.ruido_db.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-right font-mono">{row.pico_l_db != null ? row.pico_l_db.toFixed(1) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate">{row.labor ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[100px] truncate">{row.actividad ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate">{row.responsable_registro ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[100px] truncate" title={row.observaciones ?? ''}>{row.observaciones ?? '—'}</td>
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
          <div className="px-4 py-3 border-t border-slate-800">
            <span className="text-slate-500 text-xs">{rows.length} registro(s)</span>
          </div>
        )}
      </div>
    </div>
  )
}
