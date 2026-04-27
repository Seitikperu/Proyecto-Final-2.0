'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ModalPersonalProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalPersonal({ onClose, onSaved }: ModalPersonalProps) {
  const [form, setForm] = useState({
    codigo: '',
    trabajador: '',
    ocupacion: '',
    ceco: '',
    descrip_ceco: '',
    tipo_planilla: 'EMPLEADOS',
    tipo_regimen: '',
    activo: 'SI'
  })
  
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esValido = form.trabajador.trim().length > 0

  async function guardar() {
    if (!esValido) return
    setGuardando(true)
    setError(null)

    try {
      const sb = getSupabaseClient()
      const { error } = await sb.from('personal').insert([{
        codigo: form.codigo.toUpperCase() || null,
        trabajador: form.trabajador.toUpperCase(),
        ocupacion: form.ocupacion.toUpperCase() || null,
        ceco: form.ceco.toUpperCase() || null,
        descrip_ceco: form.descrip_ceco.toUpperCase() || null,
        tipo_planilla: form.tipo_planilla,
        tipo_regimen: form.tipo_regimen.toUpperCase() || null,
        activo: form.activo
      }])

      if (error) throw error
      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el Personal')
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
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-sm text-white shadow-md shadow-brand-red/20">👷</div>
            <div>
              <h2 className="text-brand-black font-extrabold text-base">Nuevo Personal</h2>
              <p className="text-brand-gray text-xs font-medium">Agregar un nuevo trabajador a la planilla</p>
            </div>
          </div>
          <button onClick={onClose} className="text-brand-gray hover:text-brand-black hover:bg-slate-200 rounded-lg p-2 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Código</label>
              <input type="text" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })}
                placeholder="Código del trabajador"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Nombre Completo (Trabajador) <span className="text-brand-red">*</span></label>
              <input type="text" value={form.trabajador} onChange={e => setForm({ ...form, trabajador: e.target.value })}
                placeholder="Apellidos y Nombres"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Ocupación / Cargo</label>
              <input type="text" value={form.ocupacion} onChange={e => setForm({ ...form, ocupacion: e.target.value })}
                placeholder="Ej: Operador de Equipo"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Tipo de Planilla</label>
              <select value={form.tipo_planilla} onChange={e => setForm({ ...form, tipo_planilla: e.target.value })}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                <option value="EMPLEADOS">EMPLEADOS</option>
                <option value="OBREROS">OBREROS</option>
                <option value="PRACTICANTES">PRACTICANTES</option>
                <option value="EXTERNOS">EXTERNOS</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Código CeCo Asignado</label>
              <input type="text" value={form.ceco} onChange={e => setForm({ ...form, ceco: e.target.value })}
                placeholder="Ej: MIN-01"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Descripción CeCo</label>
              <input type="text" value={form.descrip_ceco} onChange={e => setForm({ ...form, descrip_ceco: e.target.value })}
                placeholder="Nombre del CeCo"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Tipo Régimen</label>
              <input type="text" value={form.tipo_regimen} onChange={e => setForm({ ...form, tipo_regimen: e.target.value })}
                placeholder="Ej: 14x7"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Estado</label>
              <select value={form.activo} onChange={e => setForm({ ...form, activo: e.target.value })}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                <option value="SI">SÍ - Activo</option>
                <option value="NO">NO - Inactivo</option>
              </select>
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
              'Guardar Personal'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
