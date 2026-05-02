import React from 'react'
import { PersonalForm } from './PersonalForm'

export const metadata = {
  title: 'Creación de Código de Personal | GPIT',
  description: 'Módulo para la creación de correlativos de personal.',
}

export default function NuevoPersonalPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">
          Personal
        </h1>
        <p className="text-slate-500 text-sm">
          Genere un nuevo código correlativo de trabajador asociado a una unidad y régimen.
        </p>
      </div>
      
      <PersonalForm />
    </div>
  )
}
