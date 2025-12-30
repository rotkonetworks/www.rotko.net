/**
 * Turboflakes ONET API Service
 * Fetches validator performance grades from Turboflakes
 * Uses historical data (84 sessions / ~2 weeks) for better staking decisions
 * API docs: https://github.com/turboflakes/one-t
 */

export interface ValidatorGrade {
  address: string
  sessionsCount: number    // Number of sessions in the grade calculation
  grade: string            // A+, A, B+, B, C+, C, D+, D, F
  gradeNumeric: number     // 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0
  gradePercentage: number
  mvr: number              // Missed Votes Ratio (0-1) - historical average
  bar: number              // Bitfield Availability Ratio (0-1) - historical average
  authorityInclusion: number // % of sessions included as authority
  implicitVotes: number
  explicitVotes: number
  missedVotes: number
  totalVotes: number
}

const API_URLS: Record<string, string> = {
  polkadot: 'https://polkadot-onet-api.turboflakes.io/api/v1',
  kusama: 'https://kusama-onet-api.turboflakes.io/api/v1'
}

const GRADE_THRESHOLDS: Record<string, number> = {
  'A+': 95,
  'A': 90,
  'B+': 85,
  'B': 80,
  'C+': 75,
  'C': 70,
  'D+': 65,
  'D': 60
}

const GRADE_NUMERIC: Record<string, number> = {
  'A+': 4.5,
  'A': 4.0,
  'B+': 3.5,
  'B': 3.0,
  'C+': 2.5,
  'C': 2.0,
  'D+': 1.5,
  'D': 1.0,
  'F': 0.0
}

function calculateGrade(percentage: number): { grade: string; numeric: number } {
  if (percentage >= GRADE_THRESHOLDS['A+']) return { grade: 'A+', numeric: 4.5 }
  if (percentage >= GRADE_THRESHOLDS['A']) return { grade: 'A', numeric: 4.0 }
  if (percentage >= GRADE_THRESHOLDS['B+']) return { grade: 'B+', numeric: 3.5 }
  if (percentage >= GRADE_THRESHOLDS['B']) return { grade: 'B', numeric: 3.0 }
  if (percentage >= GRADE_THRESHOLDS['C+']) return { grade: 'C+', numeric: 2.5 }
  if (percentage >= GRADE_THRESHOLDS['C']) return { grade: 'C', numeric: 2.0 }
  if (percentage >= GRADE_THRESHOLDS['D+']) return { grade: 'D+', numeric: 1.5 }
  if (percentage >= GRADE_THRESHOLDS['D']) return { grade: 'D', numeric: 1.0 }
  return { grade: 'F', numeric: 0.0 }
}

// Number of sessions to include in historical grade (84 sessions ≈ 2 weeks on Polkadot)
const HISTORY_SESSIONS = 84

class TurboflakesService {
  private cache: Map<string, { data: ValidatorGrade; timestamp: number }> = new Map()
  private cacheTimeout = 15 * 60 * 1000 // 15 minutes (historical data changes slowly)

  async getValidatorGrade(network: string, address: string): Promise<ValidatorGrade | null> {
    const cacheKey = `${network}:${address}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    const apiUrl = API_URLS[network]
    if (!apiUrl) {
      console.warn(`[Turboflakes] Unsupported network: ${network}`)
      return null
    }

    try {
      // Use /grade endpoint with historical sessions for better staking decisions
      const url = `${apiUrl}/validators/${address}/grade?number_last_sessions=${HISTORY_SESSIONS}`
      const response = await fetch(url)

      if (!response.ok) {
        console.warn(`[Turboflakes] Failed to fetch ${network} validator ${address}: ${response.status}`)
        return null
      }

      const data = await response.json()
      const grade = this.parseHistoricalGrade(address, data)

      if (grade) {
        this.cache.set(cacheKey, { data: grade, timestamp: Date.now() })
      }

      return grade
    } catch (error) {
      console.error(`[Turboflakes] Error fetching validator data:`, error)
      return null
    }
  }

  async getValidatorGrades(network: string, addresses: string[]): Promise<Map<string, ValidatorGrade>> {
    const results = new Map<string, ValidatorGrade>()

    // Fetch in parallel with rate limiting (max 10 concurrent)
    const batchSize = 10
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize)
      const promises = batch.map(addr => this.getValidatorGrade(network, addr))
      const grades = await Promise.all(promises)

      batch.forEach((addr, idx) => {
        if (grades[idx]) {
          results.set(addr, grades[idx]!)
        }
      })
    }

    return results
  }

  private parseHistoricalGrade(address: string, data: any): ValidatorGrade | null {
    if (!data) return null

    // Historical grade endpoint returns aggregated data
    const iv = data.implicit_votes_total || 0
    const ev = data.explicit_votes_total || 0
    const mv = data.missed_votes_total || 0
    const totalVotes = iv + ev + mv

    // Calculate MVR from historical totals
    const mvr = totalVotes > 0 ? mv / totalVotes : 0

    // Calculate BAR from historical totals
    const ba = data.bitfields_availability_total || 0
    const bu = data.bitfields_unavailability_total || 0
    const bar = (ba + bu) > 0 ? ba / (ba + bu) : 1.0

    // Official Turboflakes Grade Formula
    const gradeRatio = (1 - mvr) * 0.75 + bar * 0.25
    const gradePercentage = gradeRatio * 100

    // Use API-provided grade if available, otherwise calculate
    const apiGrade = data.grade || ''
    const { grade, numeric } = apiGrade
      ? { grade: apiGrade, numeric: GRADE_NUMERIC[apiGrade] || 0 }
      : calculateGrade(gradePercentage)

    const sessionsCount = Array.isArray(data.sessions) ? data.sessions.length : 0

    return {
      address,
      sessionsCount,
      grade,
      gradeNumeric: numeric,
      gradePercentage,
      mvr,
      bar,
      authorityInclusion: data.authority_inclusion || 0,
      implicitVotes: iv,
      explicitVotes: ev,
      missedVotes: mv,
      totalVotes
    }
  }

  // Get grade color for UI
  getGradeColor(grade: string): string {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-400'
      case 'B+':
      case 'B':
        return 'text-cyan-400'
      case 'C+':
      case 'C':
        return 'text-yellow-400'
      case 'D+':
      case 'D':
        return 'text-orange-400'
      default:
        return 'text-red-400'
    }
  }

  getGradeBgColor(grade: string): string {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-900/50'
      case 'B+':
      case 'B':
        return 'bg-cyan-900/50'
      case 'C+':
      case 'C':
        return 'bg-yellow-900/50'
      case 'D+':
      case 'D':
        return 'bg-orange-900/50'
      default:
        return 'bg-red-900/50'
    }
  }

  clearCache() {
    this.cache.clear()
  }
}

export const turboflakesService = new TurboflakesService()
