import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const sb = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log('Fetching centros_costo...')
  const { data, error } = await sb.from('centros_costo').select('*', { count: 'exact' }).order('cod_ceco').limit(5)
  
  if (error) {
    console.error('SUPABASE ERROR:', error)
  } else {
    console.log('SUCCESS! Data:', data)
  }
}

test()
