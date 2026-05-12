import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edvsfklvzmjdsrydllur.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdnNma2x2em1qZHNyeWRsbHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjI4NDIsImV4cCI6MjA4OTQ5ODg0Mn0.UsPPjbnx4692pwX5BCyedv_1COGpGGuXjDBJktNiPUw'

const sb = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Testing proyectos table...")
  const { data: pData, error: pErr } = await sb.from('proyectos').select('*').limit(5)
  console.log("Proyectos:", pData, pErr)

  console.log("\nTesting usuario_proyecto table...")
  const { data: upData, error: upErr } = await sb.from('usuario_proyecto').select('*').limit(5)
  console.log("Usuario Proyecto:", upData, upErr)
}

test()
