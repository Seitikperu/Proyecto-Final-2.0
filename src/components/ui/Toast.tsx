'use client'
import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  type: ToastType
  title: string
  message?: string
}

// ── Store global simple (sin Redux) ──────────────────────────────────────────
let _listeners: Array<(t: ToastMessage) => void> = []
let _id = 0

export function showToast(type: ToastType, title: string, message?: string) {
  const toast: ToastMessage = { id: ++_id, type, title, message }
  _listeners.forEach(fn => fn(toast))
}

// ── Iconos por tipo ───────────────────────────────────────────────────────────
function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return (
    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
      </svg>
    </div>
  )
  if (type === 'error') return (
    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
  )
  return (
    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    </div>
  )
}

const BORDER: Record<ToastType, string> = {
  success: 'border-green-500/30',
  error:   'border-red-500/30',
  info:    'border-blue-500/30',
}

// ── Componente individual ─────────────────────────────────────────────────────
function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Animar entrada
    requestAnimationFrame(() => setVisible(true))
    // Auto-cerrar a los 4 s
    const t = setTimeout(() => { setVisible(false); setTimeout(onRemove, 300) }, 4000)
    return () => clearTimeout(t)
  }, [onRemove])

  return (
    <div
      className={`flex items-start gap-3 bg-slate-900 border ${BORDER[toast.type]} rounded-xl px-4 py-3 shadow-2xl w-80 transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}
    >
      <ToastIcon type={toast.type}/>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="text-slate-400 text-xs mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={() => { setVisible(false); setTimeout(onRemove, 300) }}
        className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0 mt-0.5">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}

// ── Contenedor global (montar una vez en el layout) ───────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const handler = (t: ToastMessage) => setToasts(prev => [...prev, t])
    _listeners.push(handler)
    return () => { _listeners = _listeners.filter(fn => fn !== handler) }
  }, [])

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast
            toast={t}
            onRemove={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          />
        </div>
      ))}
    </div>
  )
}
