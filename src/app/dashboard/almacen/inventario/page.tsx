'use client'
import { BackButton } from '@/components/ui/BackButton'
export default function Page() {
  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-xl font-extrabold text-brand-black mb-2">Inventario Físico</h1>
          </div>
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-12 text-center mt-6">
        <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <p className="text-brand-gray font-bold uppercase tracking-wider">Inventario Físico</p>
        <p className="text-brand-gray/80 text-sm mt-1">Tabla: <code className="text-brand-black font-semibold bg-slate-100 border border-slate-200 px-1 py-0.5 rounded">inventario</code> — 0 — inicia un conteo registros pendientes</p>
        <p className="text-brand-gray/60 text-xs mt-3">Ejecuta bulk_load.py para cargar los datos</p>
      </div>
    </div>
  )
}
