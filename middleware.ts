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

  // If not logged in and trying to access a dashboard → redirect to login
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in and on LOGIN page → redirect to their own dashboard
  // But do NOT redirect from the register page (Supabase creates session on signUp,
  // so we must let the user stay on register to see the success message)
  if (user && isLoginPage) {
    const role = user.user_metadata?.role || 'patient'
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }

  // Prevent a logged-in patient from accessing /dashboard/doctor and vice versa
  if (user && isDashboard) {
    const userRole = user.user_metadata?.role || 'patient'
    const urlRole = pathname.split('/')[2] // e.g. 'patient' or 'doctor'
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
