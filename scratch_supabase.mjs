import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edvsfklvzmjdsrydllur.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdnNma2x2em1qZHNyeWRsbHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MjI4NDIsImV4cCI6MjA4OTQ5ODg0Mn0.UsPPjbnx4692pwX5BCyedv_1COGpGGuXjDBJktNiPUw'

const sb = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log("Creando usuario de prueba...")
  // Usamos un correo random
  const email = `test-${Date.now()}@test.com`
  const password = 'password123'
  
  const { data: signUpData, error: signUpError } = await sb.auth.signUp({
    email,
    password
  })
  
  if (signUpError) {
    console.error("Error en signup:", signUpError.message)
    return
  }
  
  console.log("Sesion activa:", signUpData.session?.access_token ? "SI" : "NO")
  
  console.log("\nConsultando proyectos como usuario autenticado...")
  const { data, error } = await sb.from('proyectos').select('*')
  
  if (error) {
    console.error("Error al consultar proyectos:", error)
  } else {
    console.log("Proyectos obtenidos:", data?.length)
  }
}

testAuth()
