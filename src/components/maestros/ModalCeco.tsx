'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ModalCecoProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalCeco({ onClose, onSaved }: ModalCecoProps) {
  const [form, setForm] = useState({
    cod_ceco: '',
    centro_costo: '',
    area: '',
    familia: '',
    subfamilia: '',
    unidad_produccion: '',
    unidad_negocio: '',
    filtro_almacen: 'SI',
    corporativo: ''
  })
  
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esValido = form.cod_ceco.trim().length > 0 && form.centro_costo.trim().length > 0

  async function guardar() {
    if (!esValido) return
    setGuardando(true)
    setError(null)

    try {
      const sb = getSupabaseClient()
      const { error } = await sb.from('centros_costo').insert([{
        cod_ceco: form.cod_ceco.toUpperCase(),
        centro_costo: form.centro_costo.toUpperCase(),
        area: form.area.toUpperCase() || null,
        familia: form.familia.toUpperCase() || null,
        subfamilia: form.subfamilia.toUpperCase() || null,
        unidad_produccion: form.unidad_produccion.toUpperCase() || null,
        unidad_negocio: form.unidad_negocio.toUpperCase() || null,
        filtro_almacen: form.filtro_almacen,
        corporativo: form.corporativo.toUpperCase() || null
      }])

      if (error) throw error
      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el Centro de Costo')
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
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-sm text-white shadow-md shadow-brand-red/20">💰</div>
            <div>
              <h2 className="text-brand-black font-extrabold text-base">Nuevo Centro de Costo</h2>
              <p className="text-brand-gray text-xs font-medium">Agregar un nuevo CeCo al sistema</p>
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
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Código CeCo <span className="text-brand-red">*</span></label>
              <input type="text" value={form.cod_ceco} onChange={e => setForm({ ...form, cod_ceco: e.target.value })}
                placeholder="Ej: MIN-01"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Nombre / Descripción <span className="text-brand-red">*</span></label>
              <input type="text" value={form.centro_costo} onChange={e => setForm({ ...form, centro_costo: e.target.value })}
                placeholder="Nombre del centro de costo"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Área</label>
              <input type="text" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}
                placeholder="Área de trabajo"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Familia</label>
              <input type="text" value={form.familia} onChange={e => setForm({ ...form, familia: e.target.value })}
                placeholder="Familia contable"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Unidad de Producción</label>
              <input type="text" value={form.unidad_produccion} onChange={e => setForm({ ...form, unidad_produccion: e.target.value })}
                placeholder="Ej: Mina Jabalí"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Filtro Almacén</label>
              <select value={form.filtro_almacen} onChange={e => setForm({ ...form, filtro_almacen: e.target.value })}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                <option value="SI">SÍ - Disponible en almacén</option>
                <option value="NO">NO - Oculto</option>
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
              'Guardar CeCo'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
