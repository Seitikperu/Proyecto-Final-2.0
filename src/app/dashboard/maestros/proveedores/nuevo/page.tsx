'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/Toast'
import { BackButton } from '@/components/ui/BackButton'

export default function NuevoProveedorPage() {
  const router = useRouter()
  const sb = getSupabaseClient()
  
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState({
    proveedor: '',
    ruc_di: '',
    cod_sysman: '',
    iva: 'SI',
    ciudad: '',
    pais: '',
    contacto: '',
    telefono: '',
    celular: '',
    email: '',
    forma_pago: 'CREDITO'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.proveedor.trim()) {
      showToast('error', 'Error', 'El nombre del proveedor es obligatorio')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        proveedor: formData.proveedor,
        ruc_di: formData.ruc_di || null,
        cod_sysman: formData.cod_sysman || null,
        iva: formData.iva,
        ciudad: formData.ciudad || null,
        pais: formData.pais || null,
        contacto: formData.contacto || null,
        telefono: formData.telefono || null,
        celular: formData.celular || null,
        email: formData.email || null,
        forma_pago: formData.forma_pago || null,
        activo: true
      }

      const { error } = await sb.from('proveedores').insert([payload])
      if (error) throw error

      showToast('success', 'Guardado', 'Proveedor registrado exitosamente')
      router.push('/dashboard/maestros/proveedores')
      router.refresh()
    } catch (err: any) {
      showToast('error', 'Error al guardar', err.message || 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-2xl font-bold text-white">Nuevo Proveedor</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50">
          <p className="text-slate-400 text-sm">Ingresa los datos del nuevo proveedor (* indica campo obligatorio)</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Proveedor / Razón Social <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="proveedor"
                required
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Ej. Comercial Distribuidora S.A."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">RUC / Documento Identidad</label>
              <input
                type="text"
                name="ruc_di"
                value={formData.ruc_di}
                onChange={handleChange}
                placeholder="Ej. J0310000000000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Código Sysman</label>
              <input
                type="text"
                name="cod_sysman"
                value={formData.cod_sysman}
                onChange={handleChange}
                placeholder="Código interno (Opcional)"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                IVA (Aplica Retención) <span className="text-red-400">*</span>
              </label>
              <select
                name="iva"
                value={formData.iva}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Forma de Pago</label>
              <select
                name="forma_pago"
                value={formData.forma_pago}
                onChange={handleChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="CREDITO">Crédito</option>
                <option value="CONTADO">Contado</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <hr className="border-slate-800 my-2" />
              <h3 className="text-slate-400 font-medium mb-4">Datos de Contacto y Ubicación</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre de Contacto</label>
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@empresa.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono Fijo</label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej. 2222-1111"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Celular</label>
              <input
                type="text"
                name="celular"
                value={formData.celular}
                onChange={handleChange}
                placeholder="Ej. 8888-0000"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                placeholder="Ej. Managua"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">País</label>
              <input
                type="text"
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                placeholder="Ej. Nicaragua"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/50 disabled:bg-slate-700 disabled:text-slate-500 transition-all flex items-center gap-2"
            >
              {guardando ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar Proveedor
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
