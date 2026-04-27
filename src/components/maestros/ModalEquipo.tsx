'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ModalEquipoProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalEquipo({ onClose, onSaved }: ModalEquipoProps) {
  const [form, setForm] = useState({
    titulo: '',
    codigo_cis: '',
    categoria_equipo: '',
    fabricante: '',
    modelo: '',
    anio: '',
    propiedad: 'PROPIO',
    costo_hr_diesel: '',
    costo_hr_electrico: '',
    costo_hr_percusion: '',
    horas_minimas: ''
  })
  
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esValido = form.titulo.trim().length > 0

  async function guardar() {
    if (!esValido) return
    setGuardando(true)
    setError(null)

    try {
      const sb = getSupabaseClient()
      const { error } = await sb.from('maestro_equipos').insert([{
        titulo: form.titulo.toUpperCase(),
        codigo_cis: form.codigo_cis.toUpperCase() || null,
        categoria_equipo: form.categoria_equipo.toUpperCase() || null,
        fabricante: form.fabricante.toUpperCase() || null,
        modelo: form.modelo.toUpperCase() || null,
        anio: form.anio || null,
        propiedad: form.propiedad,
        costo_hr_diesel: form.costo_hr_diesel ? parseFloat(form.costo_hr_diesel) : null,
        costo_hr_electrico: form.costo_hr_electrico ? parseFloat(form.costo_hr_electrico) : null,
        costo_hr_percusion: form.costo_hr_percusion ? parseFloat(form.costo_hr_percusion) : null,
        horas_minimas: form.horas_minimas ? parseInt(form.horas_minimas, 10) : null
      }])

      if (error) throw error
      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el Equipo')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-sm text-white shadow-md shadow-brand-red/20">🚜</div>
            <div>
              <h2 className="text-brand-black font-extrabold text-base">Nuevo Equipo</h2>
              <p className="text-brand-gray text-xs font-medium">Agregar un nuevo equipo al maestro</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-brand-black hover:bg-slate-200 rounded-lg p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Título / Descripción <span className="text-brand-red">*</span></label>
              <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Nombre del equipo"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Código CIS</label>
              <input type="text" value={form.codigo_cis} onChange={e => setForm({ ...form, codigo_cis: e.target.value })}
                placeholder="Ej: JUMBO-01"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Categoría de Equipo</label>
              <input type="text" value={form.categoria_equipo} onChange={e => setForm({ ...form, categoria_equipo: e.target.value })}
                placeholder="Ej: Perforación"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Fabricante</label>
              <input type="text" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })}
                placeholder="Ej: Sandvik, Epiroc"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Modelo</label>
              <input type="text" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })}
                placeholder="Modelo del equipo"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Año de Fabricación</label>
              <input type="text" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })}
                placeholder="Ej: 2020"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Propiedad</label>
              <select value={form.propiedad} onChange={e => setForm({ ...form, propiedad: e.target.value })}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                <option value="PROPIO">PROPIO</option>
                <option value="ALQUILADO">ALQUILADO</option>
                <option value="CONTRATISTA">CONTRATISTA</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-2 border-t border-slate-100 mt-2">
              <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">Costos (USD)</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Costo / Hora (Diésel)</label>
              <input type="number" step="0.01" value={form.costo_hr_diesel} onChange={e => setForm({ ...form, costo_hr_diesel: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Costo / Hora (Eléctrico)</label>
              <input type="number" step="0.01" value={form.costo_hr_electrico} onChange={e => setForm({ ...form, costo_hr_electrico: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Costo / Hora (Percusión)</label>
              <input type="number" step="0.01" value={form.costo_hr_percusion} onChange={e => setForm({ ...form, costo_hr_percusion: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Horas Mínimas Diarias</label>
              <input type="number" step="1" value={form.horas_minimas} onChange={e => setForm({ ...form, horas_minimas: e.target.value })}
                placeholder="Ej: 8"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-black rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={!esValido || guardando}
            className="flex items-center gap-2 bg-brand-red hover:bg-red-700 disabled:bg-slate-300 disabled:text-white disabled:shadow-none text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-red/20 hover:shadow-brand-red/30 active:scale-95">
            {guardando ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Guardando…</>
            ) : (
              'Guardar Equipo'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
