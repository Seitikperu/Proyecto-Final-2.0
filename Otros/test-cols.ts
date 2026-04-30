import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials')
  process.exit(1)
}

const sb = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await sb.from('centros_costo').select('*').limit(1)
  if (error) {
    console.error('ERROR:', error)
  } else {
    console.log('DATA:', data)
    if (data && data.length > 0) {
      console.log('COLUMNS:', Object.keys(data[0]))
    }
  }
}

test()
