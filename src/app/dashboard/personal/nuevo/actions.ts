'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function crearPersonal(payload: any) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('fn_crear_personal', { payload })

    if (error) {
      console.error('Error in fn_crear_personal:', error)
      if (error.message.includes('TRABAJADOR_DUPLICADO'))
        return { success: false, error: 'TRABAJADOR_DUPLICADO', message: 'El trabajador ya existe en el sistema.' }
      if (error.message.includes('TIPO_REGIMEN_REQUERIDO'))
        return { success: false, error: 'TIPO_REGIMEN_REQUERIDO', message: 'El tipo de régimen es requerido.' }
      if (error.message.includes('TRABAJADOR_REQUERIDO'))
        return { success: false, error: 'TRABAJADOR_REQUERIDO', message: 'El nombre del trabajador es requerido.' }
      if (error.message.includes('CODIGO_AGOTADO'))
        return { success: false, error: 'CODIGO_AGOTADO', message: 'Se ha agotado el rango de códigos para este régimen.' }
      return { success: false, error: 'UNKNOWN_ERROR', message: error.message }
    }

    revalidatePath('/dashboard/personal')
    return { success: true, data }
  } catch (err: any) {
    console.error('Action error:', err)
    return { success: false, error: 'SERVER_ERROR', message: err.message || 'Error interno del servidor.' }
  }
}

export async function checkTrabajadorExiste(trabajador: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('personal')
      .select('id')
      .ilike('trabajador', trabajador.trim())
      .eq('activo', 'SI')
      .limit(1)

    if (error) throw error
    return { existe: data.length > 0 }
  } catch (err) {
    console.error('Error checking duplicate worker:', err)
    return { existe: false }
  }
}

export async function generarCodigoPreview(tipoRegimen: string, prefijoDefault: string = 'JABO') {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('fn_generar_codigo_personal', {
      p_tipo_regimen: tipoRegimen,
      p_prefijo_default: prefijoDefault,
    })
    if (error) throw error
    return { success: true, data: data[0] }
  } catch (err: any) {
    console.error('Error generating code preview:', err)
    return { success: false, error: err.message }
  }
}

export async function getUltimosCodigos(tipoRegimen: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('personal')
      .select('id, codigo, trabajador, ocupacion, ceco')
      .eq('tipo_regimen', tipoRegimen)
      .order('num_codigo', { ascending: false, nullsFirst: false })
      .order('num_cod2', { ascending: false, nullsFirst: false })
      .limit(5)

    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    console.error('Error fetching latest codes:', err)
    return { success: false, error: err.message, data: [] }
  }
}

// Carga todos los registros PLANILLA de centros_costo para la cascada del formulario.
// El cliente deriva: unidades → áreas → cargos CECO → auto-completa cod_ceco.
export async function getCentrosCostoData() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('centros_costo')
      .select('unidad_produccion, area, centro_costo, cod_ceco')
      .eq('familia', 'PLANILLA')
      .not('centro_costo', 'is', null)
      .order('unidad_produccion')
      .order('area')
      .order('centro_costo')

    if (error) throw error
    return { success: true, data: data as { unidad_produccion: string; area: string; centro_costo: string; cod_ceco: string }[] }
  } catch (err: any) {
    console.error('Error fetching centros_costo data:', err)
    return { success: false, error: err.message, data: [] }
  }
}

// Valores distintos de tipo_planilla presentes en personal (excluyendo nulos).
export async function getTipoPlanillaOptions() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('personal')
      .select('tipo_planilla')
      .not('tipo_planilla', 'is', null)
      .order('tipo_planilla')

    if (error) throw error
    const unique = [...new Set(data.map(r => r.tipo_planilla).filter(Boolean))] as string[]
    return { success: true, data: unique }
  } catch (err: any) {
    console.error('Error fetching tipo_planilla options:', err)
    return { success: false, error: err.message, data: [] }
  }
}

// Tipos de régimen existentes en personal (JABO, JABE, etc.) para el selector de código.
export async function getTipoRegimenOptions() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('personal')
      .select('tipo_regimen')
      .not('tipo_regimen', 'is', null)
      .order('tipo_regimen')

    if (error) throw error
    const unique = [...new Set(data.map(r => r.tipo_regimen).filter(Boolean))] as string[]
    return { success: true, data: unique }
  } catch (err: any) {
    console.error('Error fetching tipo_regimen options:', err)
    return { success: false, error: err.message, data: [] }
  }
}
