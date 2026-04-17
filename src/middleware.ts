import { NextResponse, type NextRequest } from 'next/server'

// Rutas que NO requieren sesión activa
const PUBLIC_PATHS = ['/login']

export function middleware(request: NextRequest) {
            const { pathname } = request.nextUrl
            const session = request.cookies.get('cis_session')

  // Si es ruta pública, dejar pasar siempre
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
            if (isPublic) return NextResponse.next()

  // Si no hay sesión, redirigir a /login conservando la ruta destino
  if (!session) {
                const loginUrl = new URL('/login', request.url)
                loginUrl.searchParams.set('redirectTo', pathname)
                return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
            matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
