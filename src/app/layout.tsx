import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CIS Nicaragua — Sistema de Gestión Minera',
  description: 'Gestión de Almacén y Producción — Unidad Minera Jabalí',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
