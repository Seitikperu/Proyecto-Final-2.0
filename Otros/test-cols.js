const fs = require('fs')

const env = fs.readFileSync('.env.local', 'utf-8')
let url, key;
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

async function run() {
  const fetch = (await import('node-fetch')).default || globalThis.fetch;
  
  const res = await fetch(`${url}/rest/v1/centros_costo?select=*&limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  })
  
  const text = await res.text()
  console.log(text)
}

run()
