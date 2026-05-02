'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

import { 
  crearPersonal, 
  checkTrabajadorExiste, 
  generarCodigoPreview, 
  getUltimosCodigos 
} from './actions'

// Zod Schema
const personalSchema = z.object({
  unidad_produccion: z.string().min(1, 'Seleccione Unidad'),
  tipo_planilla: z.string().min(1, 'Seleccione Planilla'),
  ocupacion: z.string().min(1, 'Ingrese Ocupación'),
  area: z.string().min(1, 'Ingrese Área'),
  cargo_ceco: z.string().min(1, 'Ingrese Cargo CECO'),
  ceco: z.string().min(1, 'Ingrese CECO'),
  codigo: z.string().optional(), // Auto-generated
  trabajador: z.string().min(3, 'Nombre del trabajador es requerido'),
})

type PersonalFormValues = z.infer<typeof personalSchema>

export function PersonalForm() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string>('')
  
  const form = useForm<PersonalFormValues>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      unidad_produccion: 'JABO',
      tipo_planilla: 'PERU',
      ocupacion: '',
      area: 'ADMINISTRACIÓN',
      cargo_ceco: '',
      ceco: '',
      codigo: '',
      trabajador: '',
    },
  })

  const { watch, setValue } = form
  const unidad = watch('unidad_produccion')
  const trabajador = watch('trabajador')

  // Derive "tipo_regimen" from unidad_produccion for simplicity, 
  // or add a dedicated field if they are different.
  const tipo_regimen = unidad

  // Query: Preview Code
  const { data: previewData, isFetching: isFetchingCode } = useQuery({
    queryKey: ['codigoPreview', tipo_regimen],
    queryFn: async () => {
      const res = await generarCodigoPreview(tipo_regimen, unidad)
      return res.data
    },
    enabled: !!tipo_regimen,
  })

  useEffect(() => {
    if (previewData?.codigo) {
      setGeneratedCode(previewData.codigo)
      setValue('codigo', previewData.codigo)
    }
  }, [previewData, setValue])

  // Query: Table Data
  const { data: tableData } = useQuery({
    queryKey: ['ultimosCodigos', tipo_regimen],
    queryFn: async () => {
      const res = await getUltimosCodigos(tipo_regimen)
      return res.data || []
    },
    enabled: !!tipo_regimen,
  })

  // Mutation: Submit Form
  const mutation = useMutation({
    mutationFn: crearPersonal,
    onSuccess: (data) => {
      if (!data.success) {
        if (data.error === 'TRABAJADOR_DUPLICADO') {
          toast({
            title: 'Error de Validación',
            description: 'Selecciona el ultimo código (Trabajador ya existe)',
            variant: 'destructive',
          })
          setIsDuplicate(true)
        } else {
          toast({
            title: 'Error',
            description: data.message,
            variant: 'destructive',
          })
        }
        return
      }

      toast({
        title: 'Éxito',
        description: `Personal creado: ${data.data?.codigo} — ${data.data?.trabajador}`,
      })
      
      form.reset()
      queryClient.invalidateQueries({ queryKey: ['ultimosCodigos'] })
      queryClient.invalidateQueries({ queryKey: ['codigoPreview'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Error inesperado',
        description: error.message,
        variant: 'destructive',
      })
    }
  })

  const onSubmit = (values: PersonalFormValues) => {
    if (isDuplicate) {
      toast({
        title: 'Atención',
        description: 'Selecciona el ultimo código',
        variant: 'destructive',
      })
      return
    }

    const payload = {
      tipo_regimen: tipo_regimen,
      prefijo_default: unidad,
      trabajador: values.trabajador,
      ocupacion: values.ocupacion,
      ceco: values.ceco,
      descrip_ceco: values.area, // Mapping area to descrip_ceco based on user logic
      tipo_planilla: values.tipo_planilla,
      aprobador01: 'Aprobador Default',
      autorizacion_salm: 'SI',
      Acceso_Almacen: 'SI',
      proyecto_id: 1, // Example
      proyecto_nombre: 'Mina Jabalí'
    }

    mutation.mutate(payload)
  }

  // Handle onBlur for Duplicate Check
  const handleTrabajadorBlur = async () => {
    if (!trabajador || trabajador.length < 3) return
    setCheckingDuplicate(true)
    const res = await checkTrabajadorExiste(trabajador)
    setIsDuplicate(res.existe)
    setCheckingDuplicate(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT COLUMN - FORM */}
      <Card className="border-t-4 border-t-navy-900 shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-xl text-navy-900 font-bold uppercase">Creación de Cód de Personal</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 bg-slate-50/50">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <FormField
                control={form.control}
                name="unidad_produccion"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                    <FormLabel className="text-right font-bold text-navy-800">UNIDAD DE PRODUCCIÓN</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-2 border-navy-800">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="JABO">JABO</SelectItem>
                        <SelectItem value="BELL">BELL</SelectItem>
                        <SelectItem value="MANAGUA">MANAGUA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-3 text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_planilla"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                    <FormLabel className="text-right font-bold text-navy-800">TIPO PLANILLA</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-2 border-navy-800">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERU">PERU</SelectItem>
                        <SelectItem value="EXTRANJERO">EXTRANJERO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-3 text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ocupacion"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                    <FormLabel className="text-right font-bold text-navy-800">OCUPACIÓN</FormLabel>
                    <FormControl className="col-span-2">
                      <Input placeholder="TÉCNICO DE PERFORACIÓN Y VOLADURA..." className="border-navy-800 uppercase" {...field} />
                    </FormControl>
                    <FormMessage className="col-span-3 text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                    <FormLabel className="text-right font-bold text-navy-800">ÁREA</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-2 border-navy-800">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMINISTRACIÓN">ADMINISTRACIÓN</SelectItem>
                        <SelectItem value="MINA">MINA</SelectItem>
                        <SelectItem value="PLANTA">PLANTA</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-3 text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cargo_ceco"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                    <FormLabel className="text-right font-bold text-navy-800">CARGO CECO</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-2 border-navy-800">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ASISTENTE DE ADMINISTRACION">ASISTENTE DE ADMINISTRACION</SelectItem>
                        <SelectItem value="OPERADOR">OPERADOR</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-3 text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ceco"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                    <FormLabel className="text-right font-bold text-navy-800">CENTRO DE COSTO</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-2 border-navy-800">
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="210240510102">210240510102</SelectItem>
                        <SelectItem value="100000000000">100000000000</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-3 text-right" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 items-center gap-4 pt-4">
                <FormLabel className="text-right font-bold text-navy-800">CÓDIGO DE TRABAJADOR</FormLabel>
                <div className="col-span-2 relative">
                  <Input 
                    readOnly 
                    value={generatedCode} 
                    className="border-navy-800 bg-white font-mono text-lg font-bold text-navy-900 tracking-wider" 
                  />
                  {isFetchingCode && (
                    <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-slate-400" />
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="trabajador"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-3 items-start gap-4 space-y-0 pt-2">
                    <FormLabel className="text-right font-bold text-navy-800 mt-2">TRABAJADOR</FormLabel>
                    <div className="col-span-2 relative">
                      <FormControl>
                        <Input 
                          placeholder="NOMBRE COMPLETO" 
                          className="border-navy-800 uppercase" 
                          {...field} 
                          onBlur={(e) => {
                            field.onBlur()
                            handleTrabajadorBlur()
                          }}
                        />
                      </FormControl>
                      
                      {/* YA EXISTE FLAG */}
                      {isDuplicate && (
                        <div className="absolute -bottom-8 left-0 bg-red-600 text-white font-bold px-4 py-1 text-sm shadow-md animate-in fade-in slide-in-from-top-2">
                          YA EXISTE
                        </div>
                      )}
                      {checkingDuplicate && (
                        <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-slate-400" />
                      )}
                    </div>
                  </FormItem>
                )}
              />

              <div className="pt-10 flex justify-center">
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || isDuplicate || checkingDuplicate}
                  className="bg-navy-900 hover:bg-navy-800 text-white w-48 font-bold py-6 text-lg tracking-wide rounded shadow-md"
                >
                  {mutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  SAVE DATA
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>

      {/* RIGHT COLUMN - TABLE */}
      <div className="flex flex-col">
        <h3 className="text-center font-bold text-navy-900 mb-2 uppercase text-sm">
          RESUMEN DE CENTRO DE COSTOS POR SELECCIÓN
        </h3>
        <Card className="border border-navy-900 rounded-none shadow-sm flex-1 overflow-hidden">
          <div className="bg-navy-900 text-white p-3 grid grid-cols-[100px_1fr_1fr] gap-4 font-bold text-xs uppercase tracking-wider">
            <div>COD</div>
            <div>TRABAJADOR</div>
            <div>OCUPACIÓN</div>
          </div>
          <div className="bg-white divide-y divide-slate-100">
            {tableData?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic">No hay registros para este régimen.</div>
            ) : (
              tableData?.map((row: any) => (
                <div key={row.id} className="p-3 grid grid-cols-[100px_1fr_1fr] gap-4 text-xs hover:bg-slate-50 transition-colors">
                  <div className="font-mono font-semibold text-navy-800">{row.codigo}</div>
                  <div className="truncate" title={row.trabajador}>{row.trabajador}</div>
                  <div className="truncate text-slate-500" title={row.ocupacion}>{row.ocupacion}</div>
                </div>
              ))
            )}
            
            {/* Show skeleton if loading */}
            {isFetchingCode && tableData?.length === 0 && (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
