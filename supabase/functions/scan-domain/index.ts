import { serve } from 'https://deno.land/std@0.224.0/http/server.ts' // Modernized Deno version
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { VULNERABILITY_PATTERNS } from '../_shared/constants.ts'
import { corsHeaders } from '../_shared/cors.ts'

// This is the core scanning logic that runs on the server.
const scanDomain = async (domain: string): Promise<Omit<ScanResult, 'scan_id' | 'user_id'>[]> => {
  const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]

  const potentialFindings = VULNERABILITY_PATTERNS.map((pattern) => ({
    description: pattern.description,
    severity: pattern.severity,
    url: `https://${normalizedDomain}${pattern.path}`,
  }))

  const checkUrl = async (url: string): Promise<boolean> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      const response = await fetch(url, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeoutId)
      return response.status < 400
    } catch (error) {
      return false
    }
  }

  const checkPromises = potentialFindings.map(async (finding) => {
    const isValid = await checkUrl(finding.url)
    return isValid ? finding : null
  })

  const results = await Promise.all(checkPromises)
  return results.filter((result): result is NonNullable<typeof result> => result !== null)
}

serve(async (req) => {
  // This new structure wraps the entire function logic in a try/catch block.
  // This is a critical fix to ensure that ANY error will be caught and
  // returned with the correct CORS headers, preventing the generic browser error.
  try {
    // 1. Handle CORS preflight request immediately.
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // 2. Safely get the Authorization header.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('User is not authenticated.')
    }

    // 3. Get request body.
    const { domain } = await req.json()
    if (!domain) {
      throw new Error('Domain is required in the request body.')
    }

    // 4. Create a Supabase client authenticated as the user.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid token.')
    }

    // 5. Create initial scan record.
    const { data: scan, error: scanError } = await userClient
      .from('scans')
      .insert({ domain, user_id: user.id, status: 'running' })
      .select()
      .single()
    if (scanError) throw new Error(`Database error (scans): ${scanError.message}`)

    // 6. Perform the scan.
    const findings = await scanDomain(domain)

    // 7. Insert findings if any exist.
    if (findings.length > 0) {
      const resultsToInsert = findings.map((finding) => ({
        ...finding,
        scan_id: scan.id,
        user_id: user.id,
      }))
      const { error: resultsError } = await userClient.from('scan_results').insert(resultsToInsert)
      if (resultsError) throw new Error(`Database error (results): ${resultsError.message}`)
    }

    // 8. Update the scan record to 'completed'.
    const { error: updateError } = await userClient
      .from('scans')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', scan.id)
    if (updateError) throw new Error(`Database error (update): ${updateError.message}`)

    // 9. Return a success response.
    return new Response(JSON.stringify({ message: 'Scan completed successfully', scanId: scan.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // This centralized error handler ensures CORS headers are always included.
    console.error('Critical function error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
