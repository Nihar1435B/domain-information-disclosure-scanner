import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
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
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5-second timeout per URL
      const response = await fetch(url, { method: 'HEAD', signal: controller.signal })
      clearTimeout(timeoutId)
      return response.status < 400
    } catch (error) {
      // This will catch network errors, DNS issues, and timeouts
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
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('User is not authenticated.')

    const { domain } = await req.json()
    if (!domain) throw new Error('Domain is required in the request body.')

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized: Invalid token.')

    // 1. Create the initial scan record. This must be awaited.
    const { data: scan, error: scanError } = await userClient
      .from('scans')
      .insert({ domain, user_id: user.id, status: 'running' })
      .select()
      .single()

    if (scanError) throw new Error(`Database error (scans): ${scanError.message}`)
    if (!scan) throw new Error('Failed to create scan record.')

    // 2. Define the long-running scan task.
    const runScanInBackground = async () => {
      try {
        const findings = await scanDomain(domain)

        if (findings.length > 0) {
          const resultsToInsert = findings.map((finding) => ({
            ...finding,
            scan_id: scan.id,
            user_id: user.id,
          }))
          const { error: resultsError } = await userClient.from('scan_results').insert(resultsToInsert)
          if (resultsError) throw resultsError
        }

        const { error: updateError } = await userClient
          .from('scans')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', scan.id)
        if (updateError) throw updateError
      } catch (err) {
        console.error(`Background scan failed for scan ID ${scan.id}:`, err.message)
        await userClient
          .from('scans')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', scan.id)
      }
    }

    // 3. Execute the scan in the background (fire-and-forget)
    //    and immediately return a response to the client.
    setTimeout(runScanInBackground, 0)

    return new Response(JSON.stringify({ message: 'Scan initiated successfully', scanId: scan.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Critical function error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
