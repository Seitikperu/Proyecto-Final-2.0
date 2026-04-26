import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  // Buscar la cookie manual que nosotros creamos (bypass del bug de Supabase SSR)
  const cisSession = request.cookies.get('cis_session')
  
  // Buscar también la cookie de Supabase por si acaso
  const supabaseSession = request.cookies.getAll().find(
    (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
  )
  
  const hasSession = !!(cisSession || supabaseSession)

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (hasSession && pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/select-project'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
