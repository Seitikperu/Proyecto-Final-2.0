import type { Metadata } from 'next'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from '@/components/Providers'
import { Toaster } from '@/components/ui/toaster'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'CIS Nicaragua — Sistema de Gestión Minera',
  description: 'Gestión de Almacén y Producción — Unidad Minera Jabalí',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className="bg-brand-light text-brand-black antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
