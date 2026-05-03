'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { showToast } from '@/components/ui/Toast'
import {
  crearPersonal,
  checkTrabajadorExiste,
  generarCodigoPreview,
  getUltimosCodigos,
  getCecoOptions,
  getAreaOptions,
} from './actions'

const schema = z.object({
  unidad_produccion: z.string().min(1, 'Requerido'),
  tipo_planilla: z.string().min(1, 'Requerido'),
  ocupacion: z.string().min(1, 'Requerido'),
  area: z.string().optional(),
  cargo_ceco: z.string().min(1, 'Seleccione un cargo CECO'),
  ceco: z.string().optional(),
  trabajador: z.string().min(3, 'Mínimo 3 caracteres'),
})

type FormValues = z.infer<typeof schema>

const FIELD_CLS =
  'w-full border border-navy-700 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600'
const LABEL_CLS = 'text-[11px] font-bold text-navy-900 uppercase tracking-wide text-right pt-2'

function Row({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[170px_1fr] items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className={LABEL_CLS}>{label}</span>
      <div>
        {children}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  )
}

export function PersonalForm() {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [isDuplicate, setIsDuplicate] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [generatedCode, setGeneratedCode] = useState('')
  const [cecoCode, setCecoCode] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      unidad_produccion: 'JABO',
      tipo_planilla: 'PERU',
      ocupacion: '',
      area: '',
      cargo_ceco: '',
      ceco: '',
      trabajador: '',
    },
  })

  const unidad = watch('unidad_produccion')
  const trabajadorVal = watch('trabajador')
  const selectedCargoKey = watch('cargo_ceco')

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { isFetching: isFetchingCode } = useQuery({
    queryKey: ['codigoPreview', unidad],
    queryFn: async () => {
      const res = await generarCodigoPreview(unidad, unidad)
      if (res.success && res.data?.codigo) setGeneratedCode(res.data.codigo)
      return res.data
    },
    enabled: !!unidad,
  })

  const { data: tableData = [] } = useQuery({
    queryKey: ['ultimosCodigos', unidad],
    queryFn: async () => {
      const res = await getUltimosCodigos(unidad)
      return res.data || []
    },
    enabled: !!unidad,
  })

  const { data: cecoOptions = [] } = useQuery({
    queryKey: ['cecoOptions'],
    queryFn: async () => {
      const res = await getCecoOptions()
      return res.data || []
    },
  })

  const { data: areaOptions = [] } = useQuery({
    queryKey: ['areaOptions'],
    queryFn: async () => {
      const res = await getAreaOptions()
      return res.data || []
    },
  })

  // Auto-fill CECO code when cargo_ceco changes
  useEffect(() => {
    if (selectedCargoKey && cecoOptions.length > 0) {
      const match = (cecoOptions as { ceco: string; descrip_ceco: string }[]).find(
        c => c.descrip_ceco === selectedCargoKey
      )
      const code = match?.ceco || ''
      setCecoCode(code)
      setValue('ceco', code)
    } else {
      setCecoCode('')
      setValue('ceco', '')
    }
  }, [selectedCargoKey, cecoOptions, setValue])

  // ─── Mutation ───────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: crearPersonal,
    onSuccess: (data) => {
      if (!data.success) {
        if (data.error === 'TRABAJADOR_DUPLICADO') {
          showToast('error', 'Trabajador ya existe en el sistema')
          setIsDuplicate(true)
        } else {
          showToast('error', data.message || 'Error al guardar')
        }
        return
      }
      showToast('success', `Personal creado: ${data.data?.codigo} — ${data.data?.trabajador}`)
      setIsDuplicate(false)
      setGeneratedCode('')
      setCecoCode('')
      reset()
      queryClient.invalidateQueries({ queryKey: ['ultimosCodigos'] })
      queryClient.invalidateQueries({ queryKey: ['codigoPreview'] })
    },
    onError: (error: any) => {
      showToast('error', error.message || 'Error inesperado')
    },
  })

  function onSubmit(values: FormValues) {
    if (isDuplicate) {
      showToast('error', 'El trabajador ya existe — verifique el nombre')
      return
    }
    mutation.mutate({
      tipo_regimen: values.unidad_produccion,
      prefijo_default: values.unidad_produccion,
      trabajador: values.trabajador,
      ocupacion: values.ocupacion,
      ceco: values.ceco || '',
      descrip_ceco: values.cargo_ceco,
      tipo_planilla: values.tipo_planilla,
      aprobador01: '',
      autorizacion_salm: 'SI',
      Acceso_Almacen: 'SI',
      proyecto_id: 1,
      proyecto_nombre: 'Mina Jabalí',
    })
  }

  async function handleTrabajadorBlur() {
    const val = trabajadorVal?.trim()
    if (!val || val.length < 3) return
    setCheckingDuplicate(true)
    const res = await checkTrabajadorExiste(val)
    setIsDuplicate(res.existe)
    setCheckingDuplicate(false)
  }

  // Distinct descriptions for CARGO CECO select
  const cargoDescriptions = [
    ...new Set(
      (cecoOptions as { ceco: string; descrip_ceco: string }[]).map(c => c.descrip_ceco)
    ),
  ].sort()

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 max-w-6xl mx-auto">

      {/* ── LEFT: FORM ─────────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <div className="bg-navy-900 px-6 py-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-widest">
            Creación de Cód de Personal
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">

          <Row label="Unidad de Producción" error={errors.unidad_produccion?.message}>
            <select className={FIELD_CLS} {...register('unidad_produccion')}>
              <option value="JABO">JABO</option>
              <option value="BELL">BELL</option>
              <option value="MANAGUA">MANAGUA</option>
            </select>
          </Row>

          <Row label="Tipo Planilla" error={errors.tipo_planilla?.message}>
            <select className={FIELD_CLS} {...register('tipo_planilla')}>
              <option value="PERU">PERU</option>
              <option value="EXTRANJERO">EXTRANJERO</option>
            </select>
          </Row>

          <Row label="Ocupación" error={errors.ocupacion?.message}>
            <input
              className={`${FIELD_CLS} uppercase placeholder:normal-case placeholder:text-slate-400`}
              placeholder="Ingrese ocupación..."
              {...register('ocupacion')}
            />
          </Row>

          <Row label="Área">
            <select className={FIELD_CLS} {...register('area')}>
              <option value="">Seleccione área...</option>
              {(areaOptions as string[]).map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Row>

          <Row label="Cargo CECO" error={errors.cargo_ceco?.message}>
            <select className={FIELD_CLS} {...register('cargo_ceco')}>
              <option value="">Seleccione cargo...</option>
              {cargoDescriptions.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Row>

          <Row label="Centro de Costo">
            <input
              readOnly
              className={`${FIELD_CLS} bg-slate-50 font-mono text-slate-600 cursor-default`}
              value={cecoCode}
              placeholder="Auto-completado"
            />
          </Row>

          <Row label="Cód. Trabajador">
            <div className="relative">
              <input
                readOnly
                className={`${FIELD_CLS} bg-slate-50 font-mono text-base font-bold text-navy-900 tracking-widest cursor-default`}
                value={generatedCode}
                placeholder={isFetchingCode ? 'Calculando...' : 'Pendiente'}
              />
              {isFetchingCode && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
          </Row>

          <Row label="Trabajador" error={errors.trabajador?.message}>
            <div className="relative">
              <input
                className={`${FIELD_CLS} uppercase placeholder:normal-case placeholder:text-slate-400 ${
                  isDuplicate ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                placeholder="NOMBRE COMPLETO"
                {...register('trabajador', { onBlur: handleTrabajadorBlur })}
              />
              {checkingDuplicate && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
              )}
              {isDuplicate && !checkingDuplicate && (
                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded">
                  YA EXISTE
                </span>
              )}
            </div>
          </Row>

          {/* Buttons */}
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 rounded bg-brand-red text-white font-bold text-sm hover:bg-red-700 transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isDuplicate || checkingDuplicate}
              className="px-8 py-2.5 rounded bg-navy-900 text-white font-bold text-sm hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              SAVE DATA
            </button>
          </div>

        </form>
      </div>

      {/* ── RIGHT: SUMMARY TABLE ───────────────────────────────────────── */}
      <div>
        <h3 className="text-center font-bold text-navy-900 text-[11px] uppercase tracking-wider mb-2">
          Resumen de Centro de Costos por Selección
        </h3>
        <div className="border border-navy-900 rounded overflow-hidden shadow-sm">
          <div className="bg-navy-900 text-white grid grid-cols-[90px_1fr_1fr] gap-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide">
            <div>Cód</div>
            <div>Trabajador</div>
            <div>Ocupación</div>
          </div>
          <div className="divide-y divide-slate-100 bg-white min-h-[200px]">
            {(tableData as any[]).length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-xs italic">
                Sin registros para este régimen
              </div>
            ) : (
              (tableData as any[]).map(row => (
                <div
                  key={row.id}
                  className="grid grid-cols-[90px_1fr_1fr] gap-2 px-3 py-2.5 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="font-mono font-bold text-navy-800">{row.codigo}</div>
                  <div className="truncate text-slate-700" title={row.trabajador}>
                    {row.trabajador}
                  </div>
                  <div className="truncate text-slate-500" title={row.ocupacion}>
                    {row.ocupacion}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
