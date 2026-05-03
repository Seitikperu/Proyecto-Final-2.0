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
  getCentrosCostoData,
  getTipoPlanillaOptions,
  getTipoRegimenOptions,
} from './actions'

interface PersonalFormProps {
  onClose?: () => void
  onSaved?: () => void
}

const schema = z.object({
  tipo_regimen:      z.string().min(1, 'Requerido'),
  unidad_produccion: z.string().min(1, 'Requerido'),
  tipo_planilla:     z.string().min(1, 'Requerido'),
  ocupacion:         z.string().min(1, 'Requerido'),
  area:              z.string().min(1, 'Seleccione un área'),
  cargo_ceco:        z.string().min(1, 'Seleccione un cargo CECO'),
  ceco:              z.string().optional(),
  trabajador:        z.string().min(3, 'Mínimo 3 caracteres'),
})

type FormValues = z.infer<typeof schema>

type CcRow = { unidad_produccion: string; area: string; centro_costo: string; cod_ceco: string }

const FIELD_CLS =
  'w-full border border-navy-700 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-navy-600 focus:border-navy-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed'
const LABEL_CLS = 'text-[11px] font-bold text-navy-900 uppercase tracking-wide text-right pt-2'

function Row({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className={LABEL_CLS}>{label}</span>
      <div>
        {children}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
    </div>
  )
}

export function PersonalForm({ onClose, onSaved }: PersonalFormProps = {}) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const [isDuplicate, setIsDuplicate]             = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [generatedCode, setGeneratedCode]         = useState('')
  const [cecoCode, setCecoCode]                   = useState('')

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        tipo_regimen:      '',
        unidad_produccion: '',
        tipo_planilla:     '',
        ocupacion:         '',
        area:              '',
        cargo_ceco:        '',
        ceco:              '',
        trabajador:        '',
      },
    })

  const tipoRegimen      = watch('tipo_regimen')
  const unidad           = watch('unidad_produccion')
  const area             = watch('area')
  const cargoCeco        = watch('cargo_ceco')
  const trabajadorVal    = watch('trabajador')

  // ─── Datos maestros (carga única) ───────────────────────────────────────────

  const { data: ccData = [] } = useQuery({
    queryKey: ['centrosCostoData'],
    queryFn: async () => {
      const res = await getCentrosCostoData()
      return (res.data || []) as CcRow[]
    },
    staleTime: Infinity,
  })

  const { data: planillaOpts = [] } = useQuery({
    queryKey: ['tipoPlanillaOptions'],
    queryFn: async () => {
      const res = await getTipoPlanillaOptions()
      return res.data || []
    },
    staleTime: Infinity,
  })

  const { data: regimenOpts = [] } = useQuery({
    queryKey: ['tipoRegimenOptions'],
    queryFn: async () => {
      const res = await getTipoRegimenOptions()
      return res.data || []
    },
    staleTime: Infinity,
  })

  // ─── Cascada derivada del cliente ───────────────────────────────────────────

  const unidades: string[] = [...new Set(ccData.map(r => r.unidad_produccion))].sort()

  const areas: string[] = unidad
    ? [...new Set(ccData.filter(r => r.unidad_produccion === unidad).map(r => r.area))].sort()
    : []

  const cargos: CcRow[] = (unidad && area)
    ? ccData.filter(r => r.unidad_produccion === unidad && r.area === area)
    : []

  // Reset en cascada al cambiar unidad
  useEffect(() => {
    setValue('area', '')
    setValue('cargo_ceco', '')
    setValue('ceco', '')
    setCecoCode('')
  }, [unidad, setValue])

  // Reset en cascada al cambiar área
  useEffect(() => {
    setValue('cargo_ceco', '')
    setValue('ceco', '')
    setCecoCode('')
  }, [area, setValue])

  // Auto-completar cod_ceco al seleccionar cargo
  useEffect(() => {
    if (cargoCeco) {
      const match = cargos.find(r => r.centro_costo === cargoCeco)
      const code = match?.cod_ceco || ''
      setCecoCode(code)
      setValue('ceco', code)
    }
  }, [cargoCeco]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Preview de código correlativo (depende de tipo_regimen) ────────────────

  const { isFetching: isFetchingCode } = useQuery({
    queryKey: ['codigoPreview', tipoRegimen],
    queryFn: async () => {
      const res = await generarCodigoPreview(tipoRegimen, tipoRegimen)
      if (res.success && res.data?.codigo) setGeneratedCode(res.data.codigo)
      else setGeneratedCode('')
      return res.data
    },
    enabled: !!tipoRegimen,
  })

  // ─── Últimas posiciones del régimen seleccionado ─────────────────────────────

  const { data: tableData = [] } = useQuery({
    queryKey: ['ultimosCodigos', tipoRegimen],
    queryFn: async () => {
      const res = await getUltimosCodigos(tipoRegimen)
      return res.data || []
    },
    enabled: !!tipoRegimen,
  })

  // ─── Mutación ───────────────────────────────────────────────────────────────

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
      onSaved?.()
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
      tipo_regimen:     values.tipo_regimen,
      prefijo_default:  values.tipo_regimen,
      trabajador:       values.trabajador,
      ocupacion:        values.ocupacion,
      ceco:             values.ceco || '',
      descrip_ceco:     values.cargo_ceco,
      tipo_planilla:    values.tipo_planilla,
      aprobador01:      '',
      autorizacion_salm: 'SI',
      Acceso_Almacen:   'SI',
      proyecto_id:      1,
      proyecto_nombre:  'Mina Jabalí',
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

  function handleCancel() {
    if (onClose) onClose()
    else router.back()
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">

      {/* ── FORMULARIO ─────────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-lg shadow-sm overflow-hidden bg-white">
        <div className="bg-navy-900 px-6 py-4">
          <h2 className="text-white font-bold text-sm uppercase tracking-widest">
            Creación de Cód de Personal
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4">

          {/* TIPO RÉGIMEN — determina el código correlativo */}
          <Row label="Tipo Régimen" error={errors.tipo_regimen?.message}>
            <select className={FIELD_CLS} {...register('tipo_regimen')}>
              <option value="">Seleccione régimen...</option>
              {(regimenOpts as string[]).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Row>

          {/* UNIDAD DE PRODUCCIÓN — de centros_costo PLANILLA */}
          <Row label="Unidad de Producción" error={errors.unidad_produccion?.message}>
            <select className={FIELD_CLS} {...register('unidad_produccion')}>
              <option value="">Seleccione unidad...</option>
              {unidades.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </Row>

          {/* TIPO PLANILLA — valores reales de personal */}
          <Row label="Tipo Planilla" error={errors.tipo_planilla?.message}>
            <select className={FIELD_CLS} {...register('tipo_planilla')}>
              <option value="">Seleccione planilla...</option>
              {(planillaOpts as string[]).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Row>

          {/* OCUPACIÓN */}
          <Row label="Ocupación" error={errors.ocupacion?.message}>
            <input
              className={`${FIELD_CLS} uppercase placeholder:normal-case placeholder:text-slate-400`}
              placeholder="Ingrese ocupación..."
              {...register('ocupacion')}
            />
          </Row>

          {/* ÁREA — filtrada por unidad */}
          <Row label="Área" error={errors.area?.message}>
            <select className={FIELD_CLS} disabled={!unidad} {...register('area')}>
              <option value="">{unidad ? 'Seleccione área...' : 'Primero elija unidad'}</option>
              {areas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </Row>

          {/* CARGO CECO — filtrado por unidad + área, muestra centro_costo */}
          <Row label="Cargo CECO" error={errors.cargo_ceco?.message}>
            <select className={FIELD_CLS} disabled={!area} {...register('cargo_ceco')}>
              <option value="">{area ? 'Seleccione cargo...' : 'Primero elija área'}</option>
              {cargos.map(c => (
                <option key={c.cod_ceco} value={c.centro_costo}>{c.centro_costo}</option>
              ))}
            </select>
          </Row>

          {/* CENTRO DE COSTO — cod_ceco auto-completado */}
          <Row label="Centro de Costo">
            <input
              readOnly
              className={`${FIELD_CLS} bg-slate-50 font-mono text-slate-600 cursor-default`}
              value={cecoCode}
              placeholder="Auto-completado al seleccionar cargo"
            />
          </Row>

          {/* CÓD. TRABAJADOR — correlativo generado */}
          <Row label="Cód. Trabajador">
            <div className="relative">
              <input
                readOnly
                className={`${FIELD_CLS} bg-slate-50 font-mono text-base font-bold text-navy-900 tracking-widest cursor-default`}
                value={generatedCode}
                placeholder={tipoRegimen ? (isFetchingCode ? 'Calculando...' : 'Pendiente') : 'Seleccione régimen'}
              />
              {isFetchingCode && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
          </Row>

          {/* TRABAJADOR */}
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

          {/* Botones */}
          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
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

      {/* ── TABLA RESUMEN (últimas posiciones del régimen) ─────────────── */}
      <div>
        <h3 className="text-center font-bold text-navy-900 text-[11px] uppercase tracking-wider mb-2">
          Últimas Posiciones — Régimen{tipoRegimen ? `: ${tipoRegimen}` : ''}
        </h3>
        <div className="border border-navy-900 rounded overflow-hidden shadow-sm">
          <div className="bg-navy-900 text-white grid grid-cols-[80px_1fr_1fr] gap-2 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide">
            <div>Cód</div>
            <div>Trabajador</div>
            <div>Ocupación</div>
          </div>
          <div className="divide-y divide-slate-100 bg-white min-h-[180px]">
            {!tipoRegimen ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-xs italic">
                Seleccione un tipo de régimen
              </div>
            ) : (tableData as any[]).length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400 text-xs italic">
                Sin registros para {tipoRegimen}
              </div>
            ) : (
              (tableData as any[]).map(row => (
                <div
                  key={row.id}
                  className="grid grid-cols-[80px_1fr_1fr] gap-2 px-3 py-2.5 text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="font-mono font-bold text-navy-800">{row.codigo}</div>
                  <div className="truncate text-slate-700" title={row.trabajador}>{row.trabajador}</div>
                  <div className="truncate text-slate-500" title={row.ocupacion}>{row.ocupacion}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
