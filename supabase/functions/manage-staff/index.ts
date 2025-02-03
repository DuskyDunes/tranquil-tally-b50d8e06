import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the current user and verify they are an admin
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (getUserError || !user) {
      throw new Error('Error getting user')
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required')
    }

    // Parse the request body
    const { action, ...data } = await req.json()

    if (action === 'add') {
      const { email, full_name } = data
      console.log('Adding staff member:', { email, full_name })

      // Create the auth user
      const { data: authUser, error: createUserError } = await supabase.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-8), // Generate a random password
        email_confirm: true,
      })

      if (createUserError) {
        throw new Error(`Error creating user: ${createUserError.message}`)
      }

      // Create the profile
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authUser.user.id,
            email,
            full_name,
            role: 'staff',
          },
        ])

      if (createProfileError) {
        throw new Error(`Error creating profile: ${createProfileError.message}`)
      }

      return new Response(
        JSON.stringify({ message: 'Staff member added successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else if (action === 'remove') {
      const { userId } = data
      console.log('Removing staff member:', userId)

      // Delete the auth user (this will cascade to the profile due to foreign key)
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
        userId
      )

      if (deleteUserError) {
        throw new Error(`Error deleting user: ${deleteUserError.message}`)
      }

      return new Response(
        JSON.stringify({ message: 'Staff member removed successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    throw new Error('Invalid action')
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})