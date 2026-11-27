import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Completely skip any auth check for the ideas dashboard
  if (request.nextUrl.pathname.startsWith('/ideas')) {
    return NextResponse.next()
  }

  // For all other pages, do nothing (or keep the original behavior if you want)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}