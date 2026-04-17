export interface IngresoAlmacen {
  id: number
  fecha: string | null
  mes: string | null
  almacen: string
  origen: string | null
  tipo_documento: string | null
  numero_documento: string | null
  numero_orden_compra: string | null
  numero_ot: string | null
  numero_guia: string | null
  solpe_rq_oc: string | null
  codigo: string | null
  descripcion: string | null
  unidad: string | null
  familia: string | null
  marca: string | null
  codigo_sysman: string | null
  ubicacion: string | null
  cantidad: number | null
  pu_usd: number | null
  pumonto: number | null
  total: number | null
  moneda: string
  iva: string
  proveedor: string | null
  recibido_por: string | null
  procesado_por: string | null
  autorizado_por: string | null
  tipo_movimiento: string | null
  validacion_transferencia: string | null
  id_filtro: string | null
  idbusq: string | null
  observacion: string | null
  modificado_por: string | null
  creado_en: string
  modificado_en: string
}

export interface SalidaAlmacen {
  id: number
  fecha: string | null
  almacen: string
  codigo: string | null
  descripcion: string | null
  unidad_medida: string | null
  stock_disponible: string | null
  cantidad: number | null
  numero_vale: string | null
  pu_usd: number | null
  total: number | null
  destino_labor: string | null
  empresa_area: string | null
  actividad: string | null
  centro_costo: string | null
  uso_especifico: string | null
  cod_cis: string | null
  solicitante: string | null
  autorizado_por: string | null
  procesado_por: string | null
  despachador: string | null
  numero_ot: string | null
  tipo_movimiento: string | null
  familia: string | null
  locacion: string | null
  conciliado: string | null
  cod_broca_barra: string | null
  marca: string | null
  motivo_cambio: string | null
  observacion: string | null
  correccion: string | null
  temp: string | null
  modificado_por: string | null
  creado_en: string
  modificado_en: string
}

export interface CentroCosto {
  id: number
  cod_ceco: string | null
  centro_costo: string | null
  area: string | null
  familia: string | null
  subfamilia: string | null
  unidad_produccion: string | null
  unidad_negocio: string | null
  filtro_almacen: string | null
  corporativo: string | null
  creado_en: string
}

export interface Material {
  id: number
  codigo: string
  descripcion: string | null
  unidad_medida: string | null
  familia: string | null
  subfamilia: string | null
  ubicacion_jabali: string | null
  ubicacion_managua: string | null
  cod_abcd: string | null
  activo: string
  vida_util: number | null
  marca_equipo: string | null
  creado_en: string
}

export interface Personal {
  id: number
  item: string | null
  codigo: string | null
  trabajador: string | null
  ocupacion: string | null
  ceco: string | null
  descrip_ceco: string | null
  tipo_planilla: string | null
  tipo_regimen: string | null
  activo: string
  creado_en: string
}

export interface Proveedor {
  id: number
  ruc_di: string | null
  proveedor: string
  cod_sysman: string | null
  iva: string
  ciudad: string | null
  pais: string | null
  contacto: string | null
  telefono: string | null
  celular: string | null
  email: string | null
  forma_pago: string | null
  activo: boolean
  creado_en: string
}

export interface MaestroEquipo {
  id: number
  titulo: string | null
  codigo_cis: string | null
  categoria_equipo: string | null
  fabricante: string | null
  modelo: string | null
  anio: string | null
  propiedad: string | null
  costo_hr_diesel: number | null
  costo_hr_electrico: number | null
  costo_hr_percusion: number | null
  horas_minimas: number | null
  creado_en: string
}

export interface MLAbor {
  id: number
  titulo: string | null
  metodo: string | null
  fase: string | null
  mina: string | null
  veta: string | null
  nivel: string | null
  zona: string | null
  tipo_labor: string | null
  material: string | null
  densidad: number | null
  prioridad: number | null
  creado_en: string
}

export interface CProyecto {
  id: number
  item: string | null
  fecha: string | null
  labor: string | null
  actividad: string | null
  ciclo: string | null
  validacion: string | null
  turno: string | null
  ejecutado: string | null
  observaciones: string | null
  avance_top: number | null
  ejecutado_medido: number | null
  responsable_registro: string | null
  validacion_topografica: string | null
  topografo: string | null
  registra_vibraciones: string | null
  codigo_equipo: string | null
  creado_en: string
  modificado_en: string
}

export interface Inventario {
  id: number
  codigo_material: string
  almacen: string
  descripcion_material: string | null
  cantidad_inventario: number | null
  fecha: string | null
  cantidad_ajuste: number | null
  observaciones: string | null
  ubicacion: string | null
  primer_filtro: string | null
  validado: string | null
  filtro_segunda_val: string | null
  creado_en: string
  modificado_en: string
}

export interface ExplosivoRegistro {
  id: number
  fecha: string | null
  tipo_disparo: string | null
  jefe_guardia: string | null
  supervisor: string | null
  labor: string | null
  tipo_actividad: string | null
  anfo: number
  emulex_25x400: number
  emulex_38x400: number
  deton_electronicos: number
  tipo_fanel: string | null
  longitud_perforacion: number
  nvale: string | null
  fanel_01: number; fanel_02: number; fanel_03: number; fanel_04: number
  fanel_05: number; fanel_06: number; fanel_07: number; fanel_08: number
  fanel_09: number; fanel_10: number; fanel_11: number; fanel_12: number
  fanel_13: number; fanel_14: number; fanel_15: number; fanel_16: number
  fanel_17: number; fanel_18: number; fanel_19: number; fanel_20: number
  fanel_21: number; fanel_22: number; fanel_23: number; fanel_24: number
  fanel_25: number; fanel_26: number; fanel_27: number; fanel_28: number
  fanel_29: number; fanel_30: number
  creado_en: string
}

export interface PlanMes {
  id: number
  mes_operativo: string | null
  titulo: string | null
  estado: string | null
  actividad: string | null
  tipo_labor: string | null
  ancho: number | null
  alto: number | null
  programa_mes: number | null
  codigo_pu: string | null
  creado_en: string
}

export interface AlmacenFilter {
  almacen?: string
  familia?: string
  proveedor?: string
  fecha_desde?: string
  fecha_hasta?: string
  busqueda?: string
}

export interface PaginationResult<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}
