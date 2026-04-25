import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as never)
          )
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // 1. Si no hay sesión y la ruta NO es pública -> pa' fuera (al login)
  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    // PARA DEPURAR: Si hubo un error en Supabase al leer la sesión, lo pasamos en la URL
    if (authError) {
      loginUrl.searchParams.set('debug_error', authError.message)
    } else {
      loginUrl.searchParams.set('debug_error', 'no_cookie_found')
    }
    return NextResponse.redirect(loginUrl)
  }

  // 2. Si HAY sesión y está en el login -> pa' adentro automáticamente
  if (user && pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/select-project'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
