// In production, nginx proxies /api/gatus/ to status.rotko.net/api/v1/
// In dev, Vite proxy handles the same path
const GATUS_API = '/api/gatus/endpoints/statuses'

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

/** Fleet-wide uptime %: successful checks / total checks across every monitored
 *  endpoint (status.rotko.net). Weighted by check count, so it reflects real
 *  availability rather than a per-endpoint average. Throws on failure so callers
 *  can fall back to a static value. */
export async function fetchFleetUptime(): Promise<number> {
  const res = await fetch(GATUS_API)
  if (!res.ok) throw new Error(`Gatus API returned ${res.status}`)
  const endpoints: GatusEndpoint[] = await res.json()
  let ok = 0
  let total = 0
  for (const ep of endpoints) {
    for (const r of ep.results || []) {
      total++
      if (r.success) ok++
    }
  }
  if (total === 0) throw new Error('Gatus returned no results')
  return Math.round((ok / total) * 10000) / 100 // 2 decimals
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
