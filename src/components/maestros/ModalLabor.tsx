'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ModalLaborProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalLabor({ onClose, onSaved }: ModalLaborProps) {
  const [form, setForm] = useState({
    titulo: '',
    metodo: '',
    fase: '',
    mina: 'JABALÍ',
    veta: '',
    nivel: '',
    zona: '',
    tipo_labor: '',
    material: '',
    densidad: '',
    prioridad: '1'
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
      const { error } = await sb.from('mlabor').insert([{
        titulo: form.titulo.toUpperCase(),
        metodo: form.metodo.toUpperCase() || null,
        fase: form.fase.toUpperCase() || null,
        mina: form.mina.toUpperCase() || null,
        veta: form.veta.toUpperCase() || null,
        nivel: form.nivel.toUpperCase() || null,
        zona: form.zona.toUpperCase() || null,
        tipo_labor: form.tipo_labor.toUpperCase() || null,
        material: form.material.toUpperCase() || null,
        densidad: form.densidad ? parseFloat(form.densidad) : null,
        prioridad: form.prioridad ? parseInt(form.prioridad, 10) : null
      }])

      if (error) throw error
      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar la Labor')
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
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-sm text-white shadow-md shadow-brand-red/20">⛏️</div>
            <div>
              <h2 className="text-brand-black font-extrabold text-base">Nueva Labor</h2>
              <p className="text-brand-gray text-xs font-medium">Agregar una nueva labor o frente de trabajo</p>
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
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Título de la Labor <span className="text-brand-red">*</span></label>
              <input type="text" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ej: SN-4315 JABALÍ"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Unidad Minera</label>
              <input type="text" value={form.mina} onChange={e => setForm({ ...form, mina: e.target.value })}
                placeholder="Ej: JABALÍ"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Veta</label>
              <input type="text" value={form.veta} onChange={e => setForm({ ...form, veta: e.target.value })}
                placeholder="Nombre de la veta"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Nivel</label>
              <input type="text" value={form.nivel} onChange={e => setForm({ ...form, nivel: e.target.value })}
                placeholder="Nivel de operación"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Zona</label>
              <input type="text" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })}
                placeholder="Zona o sector"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div className="md:col-span-2 pt-2 border-t border-slate-100 mt-2">
              <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">Clasificación Técnica</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Tipo de Labor</label>
              <input type="text" value={form.tipo_labor} onChange={e => setForm({ ...form, tipo_labor: e.target.value })}
                placeholder="Ej: Subnivel, Crucero, Galería"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Método</label>
              <input type="text" value={form.metodo} onChange={e => setForm({ ...form, metodo: e.target.value })}
                placeholder="Ej: Corte y Relleno"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Fase</label>
              <input type="text" value={form.fase} onChange={e => setForm({ ...form, fase: e.target.value })}
                placeholder="Fase del proyecto"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Material Principal</label>
              <input type="text" value={form.material} onChange={e => setForm({ ...form, material: e.target.value })}
                placeholder="Ej: Mineral, Desmonte"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Densidad (t/m³)</label>
              <input type="number" step="0.01" value={form.densidad} onChange={e => setForm({ ...form, densidad: e.target.value })}
                placeholder="Ej: 2.7"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Prioridad</label>
              <input type="number" step="1" value={form.prioridad} onChange={e => setForm({ ...form, prioridad: e.target.value })}
                placeholder="1 (Más alta) a 5"
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
              'Guardar Labor'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
