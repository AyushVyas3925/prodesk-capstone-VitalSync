import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') || 'patient'
  
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
              
              
              
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && !user.user_metadata?.role) {
        await supabase.auth.updateUser({
          data: { role: role }
        })
      }

      
      const finalRole = user?.user_metadata?.role || role
      return NextResponse.redirect(`${origin}/dashboard/${finalRole}`)
    }
  }

  
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
