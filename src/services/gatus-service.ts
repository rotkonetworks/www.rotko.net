const GATUS_API = 'https://status.rotko.net/api/v1/endpoints/statuses'

interface GatusConditionResult {
  condition: string
  success: boolean
}

interface GatusResult {
  hostname: string
  duration: number // nanoseconds
  conditionResults: GatusConditionResult[]
  success: boolean
  timestamp: string
}

interface GatusEndpoint {
  name: string
  group: string
  key: string
  results: GatusResult[]
}

export interface EndpointHealth {
  online: boolean
  latencyMs: number | null
  uptimePercent: number
  lastChecked: string | null
}

export async function fetchGatusHealth(): Promise<Map<string, EndpointHealth>> {
  const res = await fetch(GATUS_API)
  if (!res.ok) throw new Error(`Gatus API returned ${res.status}`)
  const endpoints: GatusEndpoint[] = await res.json()

  const healthMap = new Map<string, EndpointHealth>()

  for (const ep of endpoints) {
    // strip -websocket-health suffix to get the slug
    const slug = ep.name.replace(/-websocket-health$/, '')
    const results = ep.results || []
    const successCount = results.filter(r => r.success).length
    const lastResult = results[0]

    healthMap.set(slug, {
      online: lastResult?.success ?? false,
      latencyMs: lastResult ? Math.round(lastResult.duration / 1_000_000) : null,
      uptimePercent: results.length > 0 ? Math.round((successCount / results.length) * 1000) / 10 : 0,
      lastChecked: lastResult?.timestamp ?? null,
    })
  }

  return healthMap
}
