import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'patient'
  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? `/dashboard/${role}`

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // After successful login, check if user has a role. 
      // If not, it's a new sign-up via Google, so we set the initial role.
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && !user.user_metadata?.role) {
        await supabase.auth.updateUser({
          data: { role: role }
        })
      }

      // Redirect based on the final determined role
      const finalRole = user?.user_metadata?.role || role
      return NextResponse.redirect(`${origin}/dashboard/${finalRole}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
