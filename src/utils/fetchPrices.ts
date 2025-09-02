export async function fetchCryptoPrices(ids: string[]): Promise<Record<string, {price: number, change24h: number}>> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
    )
    const data = await response.json()
    
    const prices: Record<string, {price: number, change24h: number}> = {}
    for (const id of ids) {
      if (data[id]) {
        prices[id] = {
          price: data[id].usd || 0,
          change24h: data[id].usd_24h_change || 0
        }
      }
    }
    return prices
  } catch (error) {
    console.error('Failed to fetch prices:', error)
    return {}
  }
}
