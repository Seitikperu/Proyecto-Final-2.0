'use client'
import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()
  return (
    <button 
      onClick={() => router.back()}
      className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
      title="Volver"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  )
}
