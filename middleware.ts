import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isDashboard = pathname.startsWith('/dashboard')
  const isLoginPage = pathname.startsWith('/login')
  const isRegisterPage = pathname.startsWith('/register')
  const isAuthPage = isLoginPage || isRegisterPage

  
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  
  
  
  if (user && isLoginPage) {
    const role = user.user_metadata?.role || 'patient'
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }

  
  if (user && isDashboard) {
    const userRole = user.user_metadata?.role || 'patient'
    const urlRole = pathname.split('/')[2] 
    if (urlRole && urlRole !== userRole) {
      return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
