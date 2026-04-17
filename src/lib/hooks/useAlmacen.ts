'use client'
import { useEffect, useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { IngresoAlmacen, SalidaAlmacen, Material, CentroCosto, AlmacenFilter, PaginationResult, Proveedor } from '@/types/database'

const sb = getSupabaseClient()

export function useKPIAlmacen() {
  const [data, setData] = useState<{ total: number; valor: number; materiales: number; proveedores: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data: rows } = await sb.from('ingreso_almacen').select('total, codigo, proveedor')
      if (!rows) { setLoading(false); return }
      const codigos = new Set(rows.map(r => r.codigo).filter(Boolean))
      const provs = new Set(rows.map(r => r.proveedor).filter(Boolean))
      setData({
        total: rows.length,
        valor: rows.reduce((a, r) => a + (r.total ?? 0), 0),
        materiales: codigos.size,
        proveedores: provs.size,
      })
      setLoading(false)
    }
    fetch()
  }, [])

  return { data, loading }
}

export function useFamiliaStats(limit = 6) {
  const [data, setData] = useState<{ familia: string; valor: number; items: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data: rows } = await sb.from('ingreso_almacen').select('familia, total').not('familia', 'is', null)
      if (!rows) { setLoading(false); return }
      const grouped: Record<string, { familia: string; valor: number; items: number }> = {}
      rows.forEach(r => {
        const k = r.familia!
        if (!grouped[k]) grouped[k] = { familia: k, valor: 0, items: 0 }
        grouped[k].valor += r.total ?? 0
        grouped[k].items += 1
      })
      setData(Object.values(grouped).sort((a, b) => b.valor - a.valor).slice(0, limit))
      setLoading(false)
    }
    fetch()
  }, [limit])

  return { data, loading }
}

export function useIngresos(filter: AlmacenFilter = {}, page = 1, pageSize = 25) {
  const [result, setResult] = useState<PaginationResult<IngresoAlmacen>>({ data: [], count: 0, page, pageSize, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let q = sb.from('ingreso_almacen').select('*', { count: 'exact' })
        .order('fecha', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      if (filter.busqueda) q = q.or(`descripcion.ilike.%${filter.busqueda}%,codigo.ilike.%${filter.busqueda}%,proveedor.ilike.%${filter.busqueda}%`)
      if (filter.familia) q = q.eq('familia', filter.familia)
      if (filter.fecha_desde) q = q.gte('fecha', filter.fecha_desde)
      if (filter.fecha_hasta) q = q.lte('fecha', filter.fecha_hasta)
      const { data, count, error: err } = await q
      if (err) throw err
      setResult({ data: data ?? [], count: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }, [filter, page, pageSize])

  useEffect(() => { fetchData() }, [fetchData])
  return { ...result, loading, error, refetch: fetchData }
}

export function useSalidas(filter: AlmacenFilter = {}, page = 1, pageSize = 25) {
  const [result, setResult] = useState<PaginationResult<SalidaAlmacen>>({ data: [], count: 0, page, pageSize, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    let q = sb.from('salida_almacen').select('*', { count: 'exact' })
      .order('fecha', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
    if (filter.busqueda) q = q.or(`descripcion.ilike.%${filter.busqueda}%,codigo.ilike.%${filter.busqueda}%`)
    if (filter.fecha_desde) q = q.gte('fecha', filter.fecha_desde)
    if (filter.fecha_hasta) q = q.lte('fecha', filter.fecha_hasta)
    const { data, count, error } = await q
    if (error) { console.error('Error listando salidas:', error.message) }
    setResult({ data: data ?? [], count: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) })
    setLoading(false)
  }, [filter, page, pageSize])

  useEffect(() => {
    fetchData()
    const channel = sb.channel('salidas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salida_almacen' }, fetchData)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [fetchData])

  return { ...result, loading, refetch: fetchData }
}

export function useMateriales(busqueda = '', page = 1, pageSize = 20) {
  const [result, setResult] = useState<PaginationResult<Material>>({ data: [], count: 0, page, pageSize, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let q = sb.from('materiales').select('*', { count: 'exact' })
        .order('codigo').range((page - 1) * pageSize, page * pageSize - 1)
      if (busqueda) q = q.or(`descripcion.ilike.%${busqueda}%,codigo.ilike.%${busqueda}%`)
      const { data, count } = await q
      setResult({ data: data ?? [], count: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) })
      setLoading(false)
    }
    fetchData()
  }, [busqueda, page, pageSize])

  return { ...result, loading }
}

export function useProveedores(busqueda = '', page = 1, pageSize = 50) {
  const [result, setResult] = useState<PaginationResult<Proveedor>>({ data: [], count: 0, page, pageSize, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      let q = sb.from('proveedores').select('*', { count: 'exact' })
        .order('proveedor').range((page - 1) * pageSize, page * pageSize - 1)
      if (busqueda) q = q.or(`proveedor.ilike.%${busqueda}%,ruc_di.ilike.%${busqueda}%,ciudad.ilike.%${busqueda}%`)
      const { data, count, error } = await q
      if (error) { console.error('Error listando proveedores:', error.message) }
      setResult({ data: data ?? [], count: count ?? 0, page, pageSize, totalPages: Math.ceil((count ?? 0) / pageSize) })
      setLoading(false)
    }
    fetchData()
  }, [busqueda, page, pageSize])

  return { ...result, loading }
}

export function useCentrosCosto(soloAlmacen = false) {
  const [data, setData] = useState<CentroCosto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      let q = sb.from('centros_costo').select('*').order('cod_ceco').limit(500)
      if (soloAlmacen) q = q.eq('filtro_almacen', 'SI')
      const { data } = await q
      setData(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [soloAlmacen])

  return { data, loading }
}

// ── STOCK EN TIEMPO REAL ──────────────────────────────────────────────────────────────────────────────
// Calcula stock disponible por material: total_ingresado - total_salido
// Se actualiza automaticamente cuando hay INSERT/UPDATE/DELETE en las tablas
// ingreso_almacen, salida_almacen o inventario (via Supabase Realtime WebSocket)

export interface StockItem {
  codigo: string
  descripcion: string
  unidad: string
  familia: string
  total_ingresado: number
  total_salido: number
  stock_disponible: number
  ultimo_ingreso: string | null
  ultima_salida: string | null
}

export function useStockRealtime(almacen?: string) {
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const calcularStock = useCallback(async () => {
    try {
      let qI = sb.from('ingreso_almacen')
        .select('codigo,descripcion:descripcion,unidad,familia,cantidad,fecha')
        .not('codigo', 'is', null)
      if (almacen) qI = qI.eq('almacen', almacen)
      const { data: ingresos } = await qI

      let qS = sb.from('salida_almacen')
        .select('codigo,cantidad,fecha')
        .not('codigo', 'is', null)
      if (almacen) qS = qS.eq('almacen', almacen)
      const { data: salidas } = await qS

      if (!ingresos) { setLoading(false); return }

      const mapI: Record<string, { descripcion: string; unidad: string; familia: string; total: number; ultima_fecha: string | null }> = {}
      for (const r of ingresos) {
        const k = r.codigo as string
        if (!mapI[k]) mapI[k] = { descripcion: r.descripcion ?? '', unidad: r.unidad ?? '', familia: r.familia ?? '', total: 0, ultima_fecha: null }
        mapI[k].total += r.cantidad ?? 0
        if (!mapI[k].ultima_fecha || (r.fecha && r.fecha > mapI[k].ultima_fecha!)) mapI[k].ultima_fecha = r.fecha
      }

      const mapS: Record<string, { total: number; ultima_fecha: string | null }> = {}
      for (const r of (salidas ?? [])) {
        const k = r.codigo as string
        if (!mapS[k]) mapS[k] = { total: 0, ultima_fecha: null }
        mapS[k].total += r.cantidad ?? 0
        if (!mapS[k].ultima_fecha || (r.fecha && r.fecha > mapS[k].ultima_fecha!)) mapS[k].ultima_fecha = r.fecha
      }

      const resultado: StockItem[] = Object.entries(mapI).map(([codigo, ing]) => ({
        codigo,
        descripcion: ing.descripcion,
        unidad: ing.unidad,
        familia: ing.familia,
        total_ingresado: ing.total,
        total_salido: mapS[codigo]?.total ?? 0,
        stock_disponible: ing.total - (mapS[codigo]?.total ?? 0),
        ultimo_ingreso: ing.ultima_fecha,
        ultima_salida: mapS[codigo]?.ultima_fecha ?? null,
      }))

      setStock(resultado.sort((a, b) => b.stock_disponible - a.stock_disponible))
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }, [almacen])

  useEffect(() => {
    calcularStock()
    const channel = sb
      .channel('stock-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ingreso_almacen' }, calcularStock)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'salida_almacen' }, calcularStock)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, calcularStock)
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [calcularStock])

  return { stock, loading, lastUpdate, refetch: calcularStock }
}
