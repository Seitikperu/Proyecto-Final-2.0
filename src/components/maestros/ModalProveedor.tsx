'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'

interface ModalProveedorProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalProveedor({ onClose, onSaved }: ModalProveedorProps) {
  const [form, setForm] = useState({
    ruc_di: '',
    proveedor: '',
    cod_sysman: '',
    iva: 'NO',
    ciudad: '',
    pais: 'NICARAGUA',
    contacto: '',
    telefono: '',
    celular: '',
    email: '',
    forma_pago: 'CONTADO',
    activo: true
  })
  
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esValido = form.proveedor.trim().length > 0

  async function guardar() {
    if (!esValido) return
    setGuardando(true)
    setError(null)

    try {
      const sb = getSupabaseClient()
      const { error } = await sb.from('proveedores').insert([{
        ruc_di: form.ruc_di || null,
        proveedor: form.proveedor.toUpperCase(),
        cod_sysman: form.cod_sysman || null,
        iva: form.iva,
        ciudad: form.ciudad || null,
        pais: form.pais || null,
        contacto: form.contacto || null,
        telefono: form.telefono || null,
        celular: form.celular || null,
        email: form.email || null,
        forma_pago: form.forma_pago || null,
        activo: form.activo
      }])

      if (error) throw error
      onSaved()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Error al guardar el proveedor')
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
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center text-sm text-white shadow-md shadow-brand-red/20">🏢</div>
            <div>
              <h2 className="text-brand-black font-extrabold text-base">Nuevo Proveedor</h2>
              <p className="text-brand-gray text-xs font-medium">Agregar un nuevo proveedor al catálogo</p>
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
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Razón Social / Nombre <span className="text-brand-red">*</span></label>
              <input type="text" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })}
                placeholder="Nombre del proveedor"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">RUC / ID / NIT</label>
              <input type="text" value={form.ruc_di} onChange={e => setForm({ ...form, ruc_di: e.target.value })}
                placeholder="Identificación fiscal"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Cód. Sysman</label>
              <input type="text" value={form.cod_sysman} onChange={e => setForm({ ...form, cod_sysman: e.target.value })}
                placeholder="Ej: PROV_001"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">País</label>
              <input type="text" value={form.pais} onChange={e => setForm({ ...form, pais: e.target.value.toUpperCase() })}
                placeholder="Ej: NICARAGUA"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Ciudad</label>
              <input type="text" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value.toUpperCase() })}
                placeholder="Ej: MANAGUA"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Retiene IVA</label>
              <select value={form.iva} onChange={e => setForm({ ...form, iva: e.target.value })}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                <option value="SI">SÍ</option>
                <option value="NO">NO</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Forma de Pago</label>
              <select value={form.forma_pago} onChange={e => setForm({ ...form, forma_pago: e.target.value })}
                className="w-full bg-white border border-slate-300 text-brand-black rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm">
                <option value="CONTADO">CONTADO</option>
                <option value="CRÉDITO 15 DÍAS">CRÉDITO 15 DÍAS</option>
                <option value="CRÉDITO 30 DÍAS">CRÉDITO 30 DÍAS</option>
                <option value="ANTICIPO">ANTICIPO</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-2 border-t border-slate-100 mt-2">
              <h3 className="text-xs font-bold text-brand-gray uppercase tracking-wider mb-3">Datos de Contacto</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Nombre Contacto</label>
              <input type="text" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="correo@empresa.com"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Teléfono</label>
              <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                placeholder="(+505) 2222-0000"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>

            <div>
              <label className="text-xs font-semibold text-brand-gray mb-1 block">Celular</label>
              <input type="text" value={form.celular} onChange={e => setForm({ ...form, celular: e.target.value })}
                placeholder="(+505) 8888-0000"
                className="w-full bg-white border border-slate-300 text-brand-black placeholder-slate-400 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all shadow-sm"/>
            </div>
            
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <input type="checkbox" id="activo" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })}
                className="w-4 h-4 text-brand-red focus:ring-brand-red border-slate-300 rounded cursor-pointer" />
              <label htmlFor="activo" className="text-sm font-medium text-brand-black cursor-pointer">Proveedor Activo</label>
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
              'Guardar Proveedor'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
