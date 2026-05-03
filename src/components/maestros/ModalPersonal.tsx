'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { PersonalForm } from '@/app/dashboard/personal/nuevo/PersonalForm'

interface ModalPersonalProps {
  onClose: () => void
  onSaved: () => void
}

export default function ModalPersonal({ onClose, onSaved }: ModalPersonalProps) {
  // Cerrar con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-[#f0f2f5] rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Botón cerrar superpuesto sobre el header navy del formulario */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 z-10 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenido desplazable */}
        <div className="overflow-y-auto flex-1 p-5">
          <PersonalForm onClose={onClose} onSaved={onSaved} />
        </div>

      </div>
    </div>
  )
}
